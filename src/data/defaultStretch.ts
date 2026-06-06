import type { StretchSection } from '@/types/stretch'

export const STRETCH_SECTIONS: StretchSection[] = [
  {
    label: 'Upper Body — Shoulders & Chest',
    stretches: [
      {
        id: 1,
        name: 'Doorway chest opener',
        target: 'Chest · Front delts · Biceps',
        duration: '45s each side',
        durationSec: 45,
        howTo:
          'Stand in a doorway. Place both forearms on the door frame at 90°, elbows at shoulder height. Step one foot forward and gently lean your chest through the gap until you feel a deep chest stretch. Keep your chin tucked, not jutting forward.',
        feel:
          'Stretch across the chest and front of the shoulders — exactly what tightens from bench press and push days.',
        shoulderNote:
          'Use only the right arm if left shoulder is uncomfortable — single-arm version works perfectly.',
        modifications: [
          { text: 'Single arm version — use right arm only if left shoulder is sore' },
          { text: 'Against a wall — place one hand on wall at shoulder height, rotate body away' },
        ],
      },
      {
        id: 2,
        name: 'Cross-body shoulder stretch',
        target: 'Rear delt · Rotator cuff · Upper back',
        duration: '30s each side',
        durationSec: 30,
        howTo:
          'Bring your right arm straight across your chest. Use your left hand to gently pull the right arm closer. Keep the shoulder down, not hunched. Switch sides — spend extra time on the left shoulder. This directly helps rotator cuff rehab.',
        feel:
          'Deep stretch in the back of the shoulder (posterior deltoid). Left side will likely be tighter — that\'s normal with the injury.',
        modifications: [
          { text: 'Seated version — easier to isolate if standing feels unbalanced' },
        ],
      },
      {
        id: 3,
        name: 'Overhead tricep stretch',
        target: 'Triceps · Lat · Side body',
        duration: '30s each side',
        durationSec: 30,
        howTo:
          'Raise your right arm overhead, bend the elbow so your hand drops behind your head. Use your left hand to gently push the right elbow back and down. Feel the stretch down the back of the arm and into the lat.',
        feel:
          'Stretch down the back of the upper arm and into the side of the ribcage. Undoes tricep tightness from push days.',
        shoulderNote:
          'Only go as far as comfortable — do not force the left shoulder overhead if it causes pain.',
        modifications: [
          { text: 'Skip left arm — if left shoulder is painful, only do the right side' },
          { text: 'Against wall version — place elbow on wall overhead and gently lean' },
        ],
      },
      {
        id: 4,
        name: 'Neck side stretch',
        target: 'Neck · Upper traps · Scalenes',
        duration: '30s each side',
        durationSec: 30,
        howTo:
          'Sit tall. Drop your right ear toward your right shoulder. Let gravity do the work — don\'t force it. Place your right hand lightly on the left side of your head for a tiny extra pull. Keep both shoulders down and relaxed. Switch sides.',
        feel:
          'Stretch up the side of the neck and top of the shoulder. Carries huge tension from sitting, phone use, and heavy barbell work.',
        modifications: [
          { text: 'Add chin tuck first — pull chin back before dropping ear for a deeper stretch' },
        ],
      },
    ],
  },
  {
    label: 'Core & Lower Back',
    stretches: [
      {
        id: 5,
        name: 'Cat-cow',
        target: 'Spine · Lower back · Core',
        duration: '45s · 8–10 cycles',
        durationSec: 45,
        bilateral: true,
        howTo:
          'On all fours, hands under shoulders, knees under hips. Cow: inhale, drop your belly, lift your chest and tailbone — back arches down. Cat: exhale, round your spine up toward the ceiling, tuck chin and tailbone. Flow slowly between the two — one breath per movement.',
        feel:
          'Gentle mobilisation of the entire spine. Undoes stiffness from sleep and sitting. Lower back decompresses with each cycle.',
        modifications: [
          { text: 'Seated version — on a chair, same movement, less wrist stress' },
        ],
      },
      {
        id: 6,
        name: 'Lying twist',
        target: 'Lower back · Glutes · Thoracic spine',
        duration: '40s each side',
        durationSec: 40,
        howTo:
          'Lie on your back. Pull your right knee to your chest, then let it fall across your body to the left. Extend your right arm out to the side, look right. Keep both shoulders flat on the floor — let gravity pull the knee down, don\'t force it. Switch sides.',
        feel:
          'Deep rotation through the lower back and outer hip. Best morning stretch for people doing heavy squats and deadlifts.',
        modifications: [
          { text: 'Pillow under knee — if your knee doesn\'t reach the floor, support it' },
        ],
      },
      {
        id: 7,
        name: 'Child\'s pose',
        target: 'Lower back · Lats · Hips · Shoulders',
        duration: '45s',
        durationSec: 45,
        bilateral: true,
        howTo:
          'Kneel and sit back toward your heels. Extend both arms forward on the floor as far as possible, forehead resting down. Breathe deeply — with each exhale let your chest sink lower. Walk hands right to stretch the left lat, then left for the right lat.',
        feel:
          'Full spinal decompression and lat stretch. The lat stretch specifically helps with the shoulder injury. The antidote to every heavy lifting day.',
        modifications: [
          { text: 'Wide knee version — knees wide apart sinks hips lower for better lower back release' },
          { text: 'Fists on floor — if wrists hurt, make fists instead of flat palms' },
        ],
      },
    ],
  },
  {
    label: 'Hips & Legs — Tight from Squats & Runs',
    stretches: [
      {
        id: 8,
        name: 'Hip flexor lunge stretch',
        target: 'Hip flexors · Quads · Psoas',
        duration: '40s each side',
        durationSec: 40,
        howTo:
          'Step your right foot forward into a lunge, back knee on the floor. Sink your hips forward and down until you feel the stretch at the front of the left hip. Keep your torso upright — don\'t lean forward. For a deeper stretch, raise your left arm overhead and lean slightly right. Switch legs.',
        feel:
          'Deep stretch at the very front of the hip, just below the hip bone. Tight hip flexors pull the lower back forward — this directly helps posture and lower back pain.',
        modifications: [
          { text: 'Pad under knee — place a folded towel under the back knee for comfort' },
          { text: 'Hold a chair — use for balance if wobbly' },
        ],
      },
      {
        id: 9,
        name: 'Seated hamstring stretch',
        target: 'Hamstrings · Lower back',
        duration: '40s each side',
        durationSec: 40,
        howTo:
          'Sit on the floor with both legs straight out. Keep your back straight — don\'t round it. Hinge forward from the hips reaching your hands toward your feet. Hold where you feel hamstring tension. If you can\'t keep your back straight, bend your knees slightly — form matters more than reaching far.',
        feel:
          'Stretch up the back of both legs. Heavy RDLs and running both shorten the hamstrings — this undoes that tightness and protects the lower back.',
        modifications: [
          { text: 'One leg at a time — extend one leg, fold the other in — easier to keep back straight' },
          { text: 'Strap or towel — loop around foot and hold both ends for more reach' },
        ],
      },
      {
        id: 10,
        name: 'Figure-four glute stretch',
        target: 'Glutes · Piriformis · Hip rotators',
        duration: '40s each side',
        durationSec: 40,
        howTo:
          'Lie on your back, knees bent. Cross your right ankle over your left thigh just above the knee — making a figure 4 shape. Either stay here or lift the left foot and pull both legs toward your chest. Use your right elbow to gently push your right knee away from you. Switch sides.',
        feel:
          'Deep stretch inside the glute and hip. Tight glutes from Bulgarian split squats, hip thrusts, and running — this is the best release for all of them.',
        modifications: [
          { text: 'Seated version — cross ankle over knee while sitting on a chair and lean forward' },
          { text: 'Against wall — lie near a wall, foot flat on wall, easier to hold' },
        ],
      },
      {
        id: 11,
        name: 'Standing quad stretch',
        target: 'Quads · Hip flexors',
        duration: '30s each side',
        durationSec: 30,
        howTo:
          'Stand on your left leg. Bend your right knee and pull your right foot toward your glute with your right hand. Keep your knees together and stand tall — don\'t lean forward. Hold a wall for balance if needed. For a deeper stretch, tuck your pelvis slightly under. Switch legs.',
        feel:
          'Stretch down the entire front of the thigh. Leg days and running both shorten the quads significantly — this restores their length.',
        modifications: [
          { text: 'Lying version — lie face down and pull foot to glute, easier to balance' },
          { text: 'Hold a wall — touch wall with free hand for stability' },
        ],
      },
    ],
  },
]
