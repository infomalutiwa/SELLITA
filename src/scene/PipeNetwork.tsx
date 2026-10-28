import { S, bump } from '../state'
import { FlowPipe } from './FlowPipe'
import { PIPES } from './layout'

const wallGlow = () => 0.6 + 1.0 * bump(0.1, 0.17, 0.33, 0.4, S.p)
// Steigleitung leuchtet beim Wand-Scan (Leitung im Wärmebild) und auf dem Weg ins Bad (Schicht 1: Rohre)
const waterGlow = () => 0.6 + 1.0 * bump(0.34, 0.39, 0.48, 0.54, S.p) + 0.6 * bump(0.24, 0.29, 0.33, 0.37, S.p)

const RED = '#d9a37a' // Warmwasser: Kupferrohr (Rot bleibt der Thermografie vorbehalten)
const BLUE = '#2bb7ff' // Kaltwasser

export function PipeNetwork() {
  return (
    <group>
      <FlowPipe points={PIPES.coldMain} color={BLUE} glow={wallGlow} radius={0.05} />
      <FlowPipe points={PIPES.verteilerCold} color={BLUE} glow={wallGlow} />
      <FlowPipe points={PIPES.washer} color={BLUE} glow={wallGlow} radius={0.03} />
      <FlowPipe points={PIPES.hotRiser} color={RED} glow={waterGlow} radius={0.04} />
      <FlowPipe points={PIPES.coldRiser} color={BLUE} glow={waterGlow} radius={0.05} speed={0.7} />
      <FlowPipe points={PIPES.coldBasin} color={BLUE} glow={waterGlow} radius={0.035} />
      <FlowPipe points={PIPES.leakBranch} color={BLUE} glow={waterGlow} radius={0.05} />
    </group>
  )
}
