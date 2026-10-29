"""Baut aus dem Web-Export (scene.glb + frames.json + meta.json) eine Blender-Szene für das Cycles-Rendering.

Aufruf:  python render/blender_scene.py <outDir> [hdri] [--frames a:b] [--res 1280x720] [--samples 64] [--save scene.blend]
Renderbilder landen in <outDir>/frames/f_0000.png …
"""
import json
import math
import os
import sys

import bpy
from mathutils import Matrix, Vector

args = sys.argv[1:]
OUT = args[0] if args else 'render/out'
HDRI = args[1] if len(args) > 1 and not args[1].startswith('--') else 'render/hdri/evening_road_01_puresky_4k.hdr'


def opt(name, default):
    return args[args.index(name) + 1] if name in args else default


RES = [int(v) for v in opt('--res', '1280x720').split('x')]
SAMPLES = int(opt('--samples', '64'))
RANGE = opt('--frames', '')
SAVE = opt('--save', '')
RENDER = '--no-render' not in args
LIGHT_GAIN = float(opt('--light-gain', '40'))

meta = json.load(open(f'{OUT}/meta.json'))
frames = json.load(open(f'{OUT}/frames.json'))
N = len(frames)

# three.js (y oben) -> Blender (z oben)
C = Matrix(((1, 0, 0, 0), (0, 0, -1, 0), (0, 1, 0, 0), (0, 0, 0, 1)))
CI = C.inverted()


def m4(e):  # three.js speichert spaltenweise
    return Matrix([[e[c * 4 + r] for c in range(4)] for r in range(4)])


bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.ops.import_scene.gltf(filepath=f'{OUT}/scene.glb')
scene = bpy.context.scene

# --- Aufräumen: Karte, Partikel, reine Effekt-Shader entfernen -------------------------------------------
objs = {o.name: o for o in bpy.data.objects}
removed = 0
GLOW = {n for n, i in meta['materials'].items() if i.get('emissive') == 'ffc58a'}  # Ersatz-Innenlicht hinter Fenstern
for name, info in meta['objects'].items():
    o = objs.get(name)
    if o and (info.get('skip') or info.get('mat') in GLOW):
        bpy.data.objects.remove(o, do_unlink=True)
        removed += 1
objs = {o.name: o for o in bpy.data.objects}
print('removed', removed, 'remaining', len(objs))

# Hierarchie auflösen: jedes Objekt bekommt seine Welt-Matrix direkt
for o in list(bpy.data.objects):
    mw = o.matrix_world.copy()
    o.parent = None
    o.matrix_world = mw
    o.rotation_mode = 'QUATERNION'

# --- Animation pro Bild -------------------------------------------------------------------------------------
changing = set()
for f, fr in enumerate(frames):
    if f > 0:
        changing.update(fr['ch'].keys())

state = {}
for f, fr in enumerate(frames):
    for name, v in fr['ch'].items():
        state[name] = v
        o = objs.get(name)
        if not o:
            continue
        vis = v[0] > 0.5
        if f == 0 or name in changing:
            if o.type != 'LIGHT' or True:
                o.matrix_world = C @ m4(v[1:]) @ CI
            o.hide_render = not vis
            o.hide_viewport = not vis
            if name in changing:
                for path in ('location', 'rotation_quaternion', 'scale', 'hide_render', 'hide_viewport'):
                    o.keyframe_insert(path, frame=f)

for a in bpy.data.actions:
    for fc in getattr(a, 'fcurves', []):
        for k in fc.keyframe_points:
            k.interpolation = 'CONSTANT'


def constant_all():
    for a in bpy.data.actions:
        try:
            curves = a.fcurves
        except AttributeError:  # Blender 5: geschichtete Actions
            curves = [fc for layer in a.layers for strip in layer.strips for bag in strip.channelbags for fc in bag.fcurves]
        for fc in curves:
            for k in fc.keyframe_points:
                k.interpolation = 'CONSTANT'


# --- Materialien ---------------------------------------------------------------------------------------------
mats = {m.name: m for m in bpy.data.materials}


def bsdf_of(m):
    if not m.use_nodes:
        return None
    for n in m.node_tree.nodes:
        if n.type == 'BSDF_PRINCIPLED':
            return n
    return None


# unbeleuchtete/HDR-Materialien (toneMapped=false) leuchten im Original über Bloom -> hier als echte Emission
for name, info in meta['materials'].items():
    m = mats.get(name)
    if not m:
        continue
    b = bsdf_of(m)
    if not b:
        continue
    if info['type'] == 'MeshBasicMaterial' and info.get('toneMapped') is False:
        b.inputs['Emission Strength'].default_value = 4.0
        if info.get('color'):
            col = tuple(int(info['color'][i:i + 2], 16) / 255 for i in (0, 2, 4))
            b.inputs['Emission Color'].default_value = (*[c ** 2.2 for c in col], 1)
    if info['type'] == 'MeshStandardMaterial' and info.get('toneMapped') is False and info.get('emissive') not in (None, '000000'):
        b.inputs['Emission Strength'].default_value = 3.0

# Glas: dünnes Isolierglas (Fresnel-Spiegelung + Durchsicht) statt halbtransparenter Fläche
def thin_glass(m, tint=(0.92, 0.96, 1.0)):
    nt = m.node_tree; nodes = nt.nodes
    nodes.clear()
    out = nodes.new('ShaderNodeOutputMaterial')
    fr = nodes.new('ShaderNodeFresnel'); fr.inputs['IOR'].default_value = 1.52
    tr = nodes.new('ShaderNodeBsdfTransparent'); tr.inputs['Color'].default_value = (*tint, 1)
    gl = nodes.new('ShaderNodeBsdfGlossy'); gl.inputs['Roughness'].default_value = 0.02
    mix = nodes.new('ShaderNodeMixShader')
    nt.links.new(fr.outputs[0], mix.inputs[0]); nt.links.new(tr.outputs[0], mix.inputs[1]); nt.links.new(gl.outputs[0], mix.inputs[2])
    nt.links.new(mix.outputs[0], out.inputs['Surface'])


glass_n = 0
for name, info in meta['materials'].items():
    m = mats.get(name)
    if m and info.get('transparent') and info.get('opacity', 1) < 0.8 and info.get('toneMapped') is not False \
            and info['type'] in ('MeshPhysicalMaterial', 'MeshStandardMaterial') and info.get('emissive') in (None, '000000'):
        thin_glass(m)
        glass_n += 1
print('glass materials', glass_n)

# Emission/Deckkraft-Animationen
em_changing = set()
for f, fr in enumerate(frames):
    if f > 0:
        em_changing.update(fr['em'].keys())
for f, fr in enumerate(frames):
    for name, (ei, op) in fr['em'].items():
        if name not in em_changing:
            continue
        m = mats.get(name)
        b = m and bsdf_of(m)
        if not b:
            continue
        b.inputs['Emission Strength'].default_value = ei * (3.0 if meta['materials'][name].get('toneMapped') is False else 1.0)
        b.inputs['Emission Strength'].keyframe_insert('default_value', frame=f)

# --- Architektur-Schnitt als Shader-Maske (exakt wie die Clipping-Ebenen im Web) ----------------------------
cut_groups = []
for k, normal in enumerate(meta['planes']):
    g = bpy.data.node_groups.new(f'Cut{k}', 'ShaderNodeTree')
    g.interface.new_socket('Shader', in_out='INPUT', socket_type='NodeSocketShader')
    g.interface.new_socket('Shader', in_out='OUTPUT', socket_type='NodeSocketShader')
    nodes, links = g.nodes, g.links
    gi, go = nodes.new('NodeGroupInput'), nodes.new('NodeGroupOutput')
    geo = nodes.new('ShaderNodeNewGeometry')
    sep = nodes.new('ShaderNodeSeparateXYZ')
    val = nodes.new('ShaderNodeValue'); val.name = 'cut'; val.outputs[0].default_value = -10
    lt = nodes.new('ShaderNodeMath'); lt.operation = 'LESS_THAN'
    tr = nodes.new('ShaderNodeBsdfTransparent')
    mix = nodes.new('ShaderNodeMixShader')
    links.new(geo.outputs['Position'], sep.inputs[0])
    links.new(sep.outputs['X'], lt.inputs[0])
    links.new(val.outputs[0], lt.inputs[1])
    links.new(lt.outputs[0], mix.inputs[0])
    links.new(gi.outputs[0], mix.inputs[1])
    links.new(tr.outputs[0], mix.inputs[2])
    links.new(mix.outputs[0], go.inputs[0])
    for f, fr in enumerate(frames):
        val.outputs[0].default_value = -fr['planes'][k]
        val.outputs[0].keyframe_insert('default_value', frame=f)
    cut_groups.append(g)

clipped_mats = {}
for name, info in meta['objects'].items():
    if 'clip' in info and info.get('mat') and name in objs:
        clipped_mats[info['mat']] = info['clip']
for mname, k in clipped_mats.items():
    m = mats.get(mname)
    if not m or not m.use_nodes:
        continue
    nt = m.node_tree
    out = next(n for n in nt.nodes if n.type == 'OUTPUT_MATERIAL')
    src = out.inputs['Surface'].links[0].from_socket if out.inputs['Surface'].links else None
    if not src:
        continue
    gn = nt.nodes.new('ShaderNodeGroup'); gn.node_tree = cut_groups[k]
    nt.links.new(src, gn.inputs[0])
    nt.links.new(gn.outputs[0], out.inputs['Surface'])
print('clipped materials', len(clipped_mats))

# --- Wärmebild (Thermografie) als prozedurales Emissionsmaterial ----------------------------------------------
thermo_obj = next((objs[n] for n, i in meta['objects'].items() if i.get('thermo') and n in objs), None)
if thermo_obj:
    m = bpy.data.materials.new('Thermo')
    m.use_nodes = True
    nt = m.node_tree; nodes, links = nt.nodes, nt.links
    nodes.clear()
    out = nodes.new('ShaderNodeOutputMaterial')
    tc = nodes.new('ShaderNodeTexCoord')
    sep = nodes.new('ShaderNodeSeparateXYZ'); links.new(tc.outputs['UV'], sep.inputs[0])

    def mth(op, a, b=None, c=None):
        n = nodes.new('ShaderNodeMath'); n.operation = op
        for i, v in enumerate((a, b, c)):
            if v is None:
                continue
            if isinstance(v, (int, float)):
                n.inputs[i].default_value = v
            else:
                links.new(v, n.inputs[i])
        return n.outputs[0]

    def value(name):
        n = nodes.new('ShaderNodeValue'); n.name = name; return n

    vScan, vOpa, vFound, vCut = value('scan'), value('opacity'), value('found'), value('cut')
    u = sep.outputs['X']
    v = mth('SUBTRACT', 1.0, sep.outputs['Y'])  # glTF-Import dreht V
    px, py = mth('MULTIPLY', u, 3.0), mth('MULTIPLY', v, 2.3)
    comb = nodes.new('ShaderNodeCombineXYZ'); links.new(px, comb.inputs[0]); links.new(py, comb.inputs[1])
    noise = nodes.new('ShaderNodeTexNoise'); noise.inputs['Scale'].default_value = 3.0; noise.inputs['Detail'].default_value = 4
    links.new(comb.outputs[0], noise.inputs['Vector'])
    t = mth('MULTIPLY_ADD', noise.outputs['Fac'], 0.2, -0.02)
    pyd = mth('DIVIDE', mth('SUBTRACT', py, 2.0), 0.07)
    t = mth('ADD', t, mth('MULTIPLY', mth('EXPONENT', mth('MULTIPLY', mth('MULTIPLY', pyd, pyd), -1.0)), 0.22))
    dx, dy = mth('SUBTRACT', px, 1.5), mth('MULTIPLY', mth('SUBTRACT', py, 2.0), 1.25)
    d2 = mth('ADD', mth('MULTIPLY', dx, dx), mth('MULTIPLY', dy, dy))
    hot = mth('ADD', mth('MULTIPLY', mth('EXPONENT', mth('DIVIDE', d2, -0.05)), 0.45), mth('MULTIPLY', mth('EXPONENT', mth('DIVIDE', d2, -0.4)), 0.25))
    t = mth('ADD', t, mth('MULTIPLY', hot, vFound.outputs[0]))
    ramp = nodes.new('ShaderNodeValToRGB')
    cr = ramp.color_ramp
    stops = [(0.0, (0.03, 0.02, 0.12)), (0.3, (0.05, 0.35, 0.75)), (0.62, (0.98, 0.8, 0.15)), (0.85, (0.94, 0.27, 0.27)), (1.0, (1.0, 0.95, 0.9))]
    cr.elements[0].position, cr.elements[0].color = stops[0][0], (*[c ** 2.2 for c in stops[0][1]], 1)
    cr.elements[1].position, cr.elements[1].color = stops[-1][0], (*[c ** 2.2 for c in stops[-1][1]], 1)
    for pos, col in stops[1:-1]:
        e = cr.elements.new(pos); e.color = (*[c ** 2.2 for c in col], 1)
    links.new(t, ramp.inputs[0])
    emi = nodes.new('ShaderNodeEmission'); emi.inputs['Strength'].default_value = 2.0
    links.new(ramp.outputs[0], emi.inputs[0])
    # sichtbar links der Scan-Linie, rechts der Schnittkante
    alpha = mth('MULTIPLY', mth('MULTIPLY', mth('LESS_THAN', u, vScan.outputs[0]), mth('GREATER_THAN', u, vCut.outputs[0])), vOpa.outputs[0])
    tr = nodes.new('ShaderNodeBsdfTransparent')
    mix = nodes.new('ShaderNodeMixShader')
    links.new(alpha, mix.inputs[0]); links.new(tr.outputs[0], mix.inputs[1]); links.new(emi.outputs[0], mix.inputs[2])
    links.new(mix.outputs[0], out.inputs['Surface'])
    thermo_obj.data.materials.clear(); thermo_obj.data.materials.append(m)
    for f, fr in enumerate(frames):
        th = fr.get('thermo') or [0, 0, 0, 0, 0]
        for node, val in ((vScan, th[0]), (vOpa, th[1]), (vFound, th[2]), (vCut, th[3])):
            node.outputs[0].default_value = val
            node.outputs[0].keyframe_insert('default_value', frame=f)

# --- Licht: HDRI-Himmel + warme Abendsonne + gedimmte Innenleuchten ------------------------------------------
world = bpy.data.worlds.new('World'); scene.world = world
world.use_nodes = True
wn = world.node_tree.nodes; wl = world.node_tree.links
wn.clear()
env = wn.new('ShaderNodeTexEnvironment'); env.image = bpy.data.images.load(os.path.abspath(HDRI))
mapping = wn.new('ShaderNodeMapping'); tco = wn.new('ShaderNodeTexCoord')
# HDRI so drehen, dass seine Sonne aus der Richtung der Web-Sonne kommt (vorne links)
import numpy as np
img = env.image; W, H = img.size
px = np.empty(W * H * 4, np.float32); img.pixels.foreach_get(px)
lum = px.reshape(-1, 4)[:, :3].sum(1)
bi = int(lum.argmax())
u = (bi % W + 0.5) / W
pix_az = -2 * math.pi * u  # Azimut der HDRI-Sonne (Blender-Equirect)
want = C @ Vector((-9, 7, 10)).to_4d()
want_az = math.atan2(want.y, want.x)
mapping.inputs['Rotation'].default_value[2] = pix_az - want_az + math.radians(float(opt('--hdri-rot', '0')))
print('hdri sun u', round(u, 3), 'v', round((bi // W) / H, 3), 'rot', round(math.degrees(pix_az - want_az), 1))
wl.new(tco.outputs['Generated'], mapping.inputs['Vector']); wl.new(mapping.outputs[0], env.inputs['Vector'])
bg = wn.new('ShaderNodeBackground'); bg.inputs['Strength'].default_value = float(opt('--hdri-strength', '0.7'))
wo = wn.new('ShaderNodeOutputWorld')
wl.new(env.outputs['Color'], bg.inputs['Color']); wl.new(bg.outputs[0], wo.inputs['Surface'])

sun_data = bpy.data.lights.new('Sun', 'SUN')
sun_data.energy = float(opt('--sun', '2.6'))
sun_data.color = (1.0, 0.8, 0.62)
sun_data.angle = math.radians(1.2)
sun = bpy.data.objects.new('Sun', sun_data)
if float(opt('--sun', '2.6')) > 0:
    scene.collection.objects.link(sun)
sun.rotation_euler = (C @ Vector((-9, 7, 10)).to_4d()).to_3d().to_track_quat('Z', 'Y').to_euler()

for o in bpy.data.objects:
    if o.type == 'LIGHT' and o.name != 'Sun':
        o.data.energy *= LIGHT_GAIN
        o.data.shadow_soft_size = 0.15

# --- Horizont: Hecken-Sträucher als Baumreihe im Hintergrund vervielfältigen ---------------------------------
import random
random.seed(7)
hedge = [o for o in bpy.data.objects if o.type == 'MESH' and not o.hide_render
         and 6.8 < Vector((o.matrix_world.translation.x, o.matrix_world.translation.y)).length < 8.2 and o.matrix_world.translation.z < 1.0]
print('hedge meshes', len(hedge))
if hedge:
    for i in range(int(opt('--trees', '70'))):
        src = random.choice(hedge)
        d = src.copy()  # verlinkte Mesh-Daten
        scene.collection.objects.link(d)
        # nur hinter und seitlich vom Haus (Kamera steht auf -Y)
        a = random.uniform(math.radians(-15), math.radians(195)); r = random.uniform(15, 34)
        sc = random.uniform(2.0, 3.0)
        d.animation_data_clear()
        d.matrix_world = Matrix.Translation((math.cos(a) * r, math.sin(a) * r, 0)) @ Matrix.Rotation(random.uniform(0, 6.28), 4, 'Z') @ Matrix.Scale(sc, 4) @ Matrix.Translation(-Vector((src.matrix_world.translation.x, src.matrix_world.translation.y, 0))) @ src.matrix_world
        d.hide_render = False; d.hide_viewport = False

# --- Kamera ------------------------------------------------------------------------------------------------
cam_data = bpy.data.cameras.new('Cam')
cam_data.sensor_fit = 'VERTICAL'
cam = bpy.data.objects.new('Cam', cam_data); scene.collection.objects.link(cam); scene.camera = cam
cam.rotation_mode = 'QUATERNION'
cam_data.dof.use_dof = True
cam_data.dof.aperture_fstop = float(opt('--fstop', '4.0'))
for f, fr in enumerate(frames):
    cam.matrix_world = C @ m4(fr['cam'])
    cam_data.angle_y = math.radians(fr['fov'])
    foc = C @ Vector(fr['focus']).to_4d()
    cam_data.dof.focus_distance = (cam.matrix_world.translation - foc.to_3d()).length
    cam.keyframe_insert('location', frame=f); cam.keyframe_insert('rotation_quaternion', frame=f)
    cam_data.keyframe_insert('lens', frame=f); cam_data.dof.keyframe_insert('focus_distance', frame=f)

constant_all()

# --- Render-Einstellungen ------------------------------------------------------------------------------------
scene.render.engine = 'CYCLES'
cy = scene.cycles
cy.device = 'CPU'
cy.samples = SAMPLES
cy.adaptive_threshold = 0.03
cy.use_denoising = True
cy.denoiser = 'OPENIMAGEDENOISE'
# viele transparente Schichten (Schnitt-Fassade, Glas) -> hohe Gesamtgrenze, sonst bleiben Innenräume schwarz
cy.max_bounces = 32; cy.diffuse_bounces = 3; cy.glossy_bounces = 3; cy.transmission_bounces = 6; cy.transparent_max_bounces = 64
cy.caustics_reflective = False; cy.caustics_refractive = False
cy.sample_clamp_indirect = 4.0
scene.render.use_persistent_data = True
scene.render.resolution_x, scene.render.resolution_y = RES
scene.render.resolution_percentage = 100
scene.render.film_transparent = False
scene.view_settings.view_transform = 'AgX'
try:
    scene.view_settings.look = 'AgX - Medium High Contrast'
except TypeError:
    pass
scene.view_settings.exposure = float(opt('--exposure', '0'))
scene.render.image_settings.file_format = 'PNG'
scene.frame_start, scene.frame_end = 0, N - 1
if RANGE:
    a, b = RANGE.split(':'); scene.frame_start, scene.frame_end = int(a), int(b)
scene.render.filepath = os.path.abspath(f'{OUT}/frames/f_')
scene.render.use_overwrite = False  # fortsetzbar: fertige Bilder überspringen
scene.render.use_placeholder = True
if SAVE:
    bpy.ops.wm.save_as_mainfile(filepath=os.path.abspath(SAVE))
if RENDER:
    bpy.ops.render.render(animation=True)
