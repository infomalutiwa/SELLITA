import { S, bump, smooth } from '../state'
import { FlowPipe } from './FlowPipe'
import { PIPES } from './layout'

const wallGlow = () => 0.6 + 1.0 * bump(0.1, 0.17, 0.33, 0.4, S.p)
const waterGlow = () => 0.6 + 1.0 * bump(0.3, 0.38, 0.52, 0.6, S.p) + 0.5 * smooth(0.5, 0.58, S.p) * (1 - smooth(0.7, 0.75, S.p))

const RED = '#ff3b1f' // Warmwasser (Sanitär)
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
