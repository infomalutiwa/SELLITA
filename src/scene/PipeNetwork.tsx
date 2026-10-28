import { S, bump, smooth } from '../state'
import { FlowPipe } from './FlowPipe'
import { PIPES } from './layout'

const heatGlow = () => 0.55 + 1.1 * bump(0.1, 0.17, 0.3, 0.4, S.p)
const waterGlow = () => 0.55 + 1.0 * bump(0.3, 0.38, 0.52, 0.6, S.p) + 0.5 * smooth(0.5, 0.58, S.p) * (1 - smooth(0.7, 0.75, S.p))

const RED = '#ff3b1f'
const BLUE = '#2bb7ff'

export function PipeNetwork() {
  return (
    <group>
      {/* Heizkreis */}
      <FlowPipe points={PIPES.heatFlow} color={RED} glow={heatGlow} radius={0.05} />
      <FlowPipe points={PIPES.heatReturn} color="#ff7a1a" glow={heatGlow} radius={0.045} speed={-0.5} />
      <FlowPipe points={PIPES.tankLink} color={RED} glow={heatGlow} />
      <FlowPipe points={PIPES.floorHeating} color="#ff5722" glow={heatGlow} radius={0.035} speed={0.35} />
      {/* Warmwasser */}
      <FlowPipe points={PIPES.hotRiser} color={RED} glow={waterGlow} radius={0.04} />
      {/* Kaltwasser / Steigleitung */}
      <FlowPipe points={PIPES.coldMain} color={BLUE} glow={waterGlow} />
      <FlowPipe points={PIPES.coldRiser} color={BLUE} glow={waterGlow} radius={0.05} speed={0.7} />
      <FlowPipe points={PIPES.coldBasin} color={BLUE} glow={waterGlow} radius={0.035} />
      <FlowPipe points={PIPES.tankCold} color={BLUE} glow={waterGlow} />
      <FlowPipe points={PIPES.leakBranch} color={BLUE} glow={waterGlow} radius={0.05} />
    </group>
  )
}
