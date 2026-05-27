import type { GymDay } from '@/types/gym'

export const GYM_DAYS: GymDay[] = [
  {
    name: "Monday — Push",
    sub: "Chest · Shoulders · Triceps · Strength focus",
    duration: "45 min",
    type: "strength",
    exercises: 7,
    sets: 22,
    warmup: "5 min — arm circles, band pull-aparts, 2×10 light push-ups",
    injuryNote: "Left shoulder: use dumbbells over barbell for overhead. Keep left side lighter if needed.",
    sections: [
      {
        label: "Compounds",
        exercises: [
          {
            id: "mon-push-0",
            name: "Barbell Bench Press",
            type: "compound",
            muscle: "Chest · Front delts · Triceps",
            sets: 4, reps: "5–6", rest: "2 min",
            tip: "Heaviest lift of the day. Do 1 warm-up set at 60% before working sets. Elbows at 45°, not flared wide. Leave 1–2 reps in the tank.",
            alts: [
              { name: "Dumbbell Bench Press", reason: "Easier on shoulder, more range of motion" },
              { name: "Smith Machine Bench", reason: "Good if no spotter available" },
              { name: "Floor Press", reason: "Reduces shoulder stress if pain flares up" }
            ]
          },
          {
            id: "mon-push-1",
            name: "Seated DB Overhead Press",
            type: "compound",
            muscle: "All 3 shoulder heads · Triceps",
            sets: 3, reps: "8–10", rest: "90 sec",
            tip: "Seated removes lower back strain. Press to just above head — don't fully lock out. Safer than barbell for your left shoulder.",
            alts: [
              { name: "Machine Shoulder Press", reason: "Fixed path, safest option for shoulder injury" },
              { name: "Cable Overhead Press", reason: "Constant tension, low shoulder stress" },
              { name: "Pike Push-Up", reason: "Bodyweight option if no equipment available" }
            ]
          }
        ]
      },
      {
        label: "Accessories",
        exercises: [
          {
            id: "mon-push-2",
            name: "Incline Dumbbell Press",
            type: "iso",
            muscle: "Upper chest · Front delts",
            sets: 3, reps: "10–12", rest: "60 sec",
            tip: "30–45° incline. Control the descent — 2 seconds down. Last set push close to failure.",
            alts: [
              { name: "Incline Machine Press", reason: "More stable, good for higher reps" },
              { name: "Low-to-high Cable Fly", reason: "Constant tension on upper chest" }
            ]
          },
          {
            id: "mon-push-3",
            name: "Cable Chest Fly / Pec Deck",
            type: "iso",
            muscle: "Inner chest",
            sets: 3, reps: "12–15", rest: "45 sec",
            tip: "Light weight, full stretch at the start. Squeeze hard at the centre. This is a pump exercise — don't go heavy.",
            alts: [
              { name: "Dumbbell Fly", reason: "Classic alternative, focus on stretch" },
              { name: "Push-Up (wide grip)", reason: "Bodyweight option, hits inner chest" }
            ]
          },
          {
            id: "mon-push-4",
            name: "Lateral Raises (Dumbbell)",
            type: "iso",
            muscle: "Side delts",
            sets: 4, reps: "15–20", rest: "45 sec",
            tip: "Lead with the elbow, not the hand. Slight bend at elbow. Keep left arm lighter if shoulder aches. 4 sets because side delts are key for shoulder width.",
            alts: [
              { name: "Cable Lateral Raise", reason: "Constant tension — better muscle activation" },
              { name: "Machine Lateral Raise", reason: "Controlled path, easier on joints" }
            ]
          },
          {
            id: "mon-push-5",
            name: "Tricep Rope Pushdown",
            type: "iso",
            muscle: "All 3 tricep heads",
            sets: 3, reps: "12–15", rest: "45 sec",
            tip: "Flare the rope apart at the bottom — this hits the lateral head. Keep elbows pinned to sides throughout the movement.",
            alts: [
              { name: "Bar Pushdown", reason: "Heavier load possible, hits long head more" },
              { name: "Single-arm Pushdown", reason: "Better isolation, good for imbalances" }
            ]
          },
          {
            id: "mon-push-6",
            name: "Overhead DB Tricep Extension",
            type: "iso",
            muscle: "Tricep long head",
            sets: 2, reps: "12–15", rest: "45 sec",
            tip: "Hold one dumbbell with both hands overhead. Keep elbows close to your head. Swap for skull crushers if left shoulder is uncomfortable.",
            alts: [
              { name: "Skull Crushers (EZ bar)", reason: "Less shoulder involvement, heavier load" },
              { name: "Cable Overhead Extension", reason: "Constant tension, easy on joints" },
              { name: "Bench Dips", reason: "Bodyweight, no shoulder overhead stress" }
            ]
          }
        ]
      }
    ]
  },
  {
    name: "Tuesday — Legs",
    sub: "Quads · Hamstrings · Glutes · Calves",
    duration: "45 min",
    type: "strength",
    exercises: 7,
    sets: 23,
    warmup: "5 min — leg swings, hip circles, 15 bodyweight squats, 10 walking lunges",
    injuryNote: undefined,
    sections: [
      {
        label: "Compounds",
        exercises: [
          {
            id: "tue-legs-0",
            name: "Barbell Back Squat",
            type: "compound",
            muscle: "Quads · Glutes · Hamstrings · Core",
            sets: 4, reps: "6–8", rest: "2 min",
            tip: "1 warm-up set at 60%. Squat to parallel or below. Chest up, knees track over toes, drive through the whole foot. King of leg exercises.",
            alts: [
              { name: "Goblet Squat (Dumbbell)", reason: "Better for learning form, less spinal load" },
              { name: "Hack Squat (Machine)", reason: "Great quad isolation, no balance needed" },
              { name: "Leg Press", reason: "Highest volume alternative, very safe" }
            ]
          },
          {
            id: "tue-legs-1",
            name: "Romanian Deadlift (RDL)",
            type: "compound",
            muscle: "Hamstrings · Glutes · Lower back",
            sets: 3, reps: "8–10", rest: "90 sec",
            tip: "Hinge at hips, slight knee bend. Bar stays close to legs. Feel the hamstring stretch at the bottom — that's where the growth happens.",
            alts: [
              { name: "Dumbbell RDL", reason: "Easier to learn, less lower back stress" },
              { name: "Single-leg RDL", reason: "Better balance and glute activation" },
              { name: "Good Mornings", reason: "More lower back emphasis" }
            ]
          }
        ]
      },
      {
        label: "Accessories",
        exercises: [
          {
            id: "tue-legs-2",
            name: "Leg Press",
            type: "iso",
            muscle: "Quads · Glutes",
            sets: 3, reps: "10–12", rest: "60 sec",
            tip: "Feet shoulder-width mid-platform. Don't lock knees at the top. High foot placement targets glutes more, low placement targets quads.",
            alts: [
              { name: "Smith Machine Squat", reason: "Good substitute if leg press taken" },
              { name: "Step-Ups (Dumbbell)", reason: "Unilateral, good for fixing imbalances" }
            ]
          },
          {
            id: "tue-legs-3",
            name: "Leg Curl (Machine)",
            type: "iso",
            muscle: "Hamstrings",
            sets: 3, reps: "12–15", rest: "60 sec",
            tip: "Full range of motion. Squeeze at the top, slow on the way back (2 sec eccentric). Toes slightly inward hits outer hamstring.",
            alts: [
              { name: "Nordic Curl", reason: "Very challenging bodyweight option" },
              { name: "Swiss Ball Hamstring Curl", reason: "Good if machine unavailable" },
              { name: "Dumbbell Leg Curl", reason: "Hold dumbbell between feet lying on bench" }
            ]
          },
          {
            id: "tue-legs-4",
            name: "Leg Extension (Machine)",
            type: "iso",
            muscle: "Quads (isolation)",
            sets: 3, reps: "12–15", rest: "45 sec",
            tip: "Pause 1 second at full extension. This is a finishing move — keep weight moderate. Great pump exercise at the end of quad work.",
            alts: [
              { name: "Wall Sit", reason: "Bodyweight quad burner, no machine needed" },
              { name: "Terminal Knee Extension (band)", reason: "Good for VMO (inner quad) activation" }
            ]
          },
          {
            id: "tue-legs-5",
            name: "Walking Lunges (Dumbbell)",
            type: "iso",
            muscle: "Quads · Glutes · Balance",
            sets: 3, reps: "12 each leg", rest: "60 sec",
            tip: "Long stride, back knee just above the floor. Keep torso upright. Don't let the front knee cave inward.",
            alts: [
              { name: "Reverse Lunge", reason: "Less knee stress, good for beginners" },
              { name: "Split Squat", reason: "Static version, easier to control" },
              { name: "Step-Ups", reason: "Lower knee impact alternative" }
            ]
          },
          {
            id: "tue-legs-6",
            name: "Standing Calf Raise",
            type: "iso",
            muscle: "Gastrocnemius (outer calf)",
            sets: 4, reps: "15–20", rest: "45 sec",
            tip: "Full stretch at the bottom (heels below the step), full contraction at top. Pause 1 sec at peak. Calves are stubborn — high reps and full ROM beat heavy weight.",
            alts: [
              { name: "Seated Calf Raise", reason: "Targets soleus (inner calf) more" },
              { name: "Leg Press Calf Raise", reason: "On the leg press machine, same movement" }
            ]
          }
        ]
      }
    ]
  },
  {
    name: "Wednesday — Pull",
    sub: "Back · Biceps · Rear delts · No pull-ups",
    duration: "45 min",
    type: "strength",
    exercises: 7,
    sets: 23,
    warmup: "5 min — shoulder rotations, band pull-aparts ×15, light cable row ×10",
    injuryNote: "No pull-ups or chin-ups. All pulling is horizontal or cable-based to protect left shoulder.",
    sections: [
      {
        label: "Compounds",
        exercises: [
          {
            id: "wed-pull-0",
            name: "Barbell Bent-Over Row",
            type: "compound",
            muscle: "Mid back · Lats · Biceps · Rear delts",
            sets: 4, reps: "6–8", rest: "2 min",
            tip: "Hinge to ~45°. Pull bar to lower chest, elbows drive back. Don't jerk — controlled pull every rep. This is the pull day's main strength lift.",
            alts: [
              { name: "Dumbbell Bent-Over Row", reason: "Less spinal load, easier to learn" },
              { name: "Pendlay Row", reason: "Bar starts on floor — more explosive, more power" },
              { name: "T-bar Row", reason: "Chest supported option reduces lower back fatigue" }
            ]
          },
          {
            id: "wed-pull-1",
            name: "Seated Cable Row (close grip)",
            type: "compound",
            muscle: "Mid back · Biceps · Rear delts",
            sets: 3, reps: "10–12", rest: "90 sec",
            tip: "Sit tall, chest up. Pull to belly button. Squeeze shoulder blades together at the end. Don't round the back on the way forward.",
            alts: [
              { name: "Machine Row", reason: "Chest-supported, great for back isolation" },
              { name: "Resistance Band Row", reason: "Home option, still effective" }
            ]
          }
        ]
      },
      {
        label: "Accessories",
        exercises: [
          {
            id: "wed-pull-2",
            name: "Lat Pulldown (wide grip)",
            type: "iso",
            muscle: "Lats · Biceps",
            sets: 3, reps: "10–12", rest: "60 sec",
            tip: "Pull to upper chest, slight lean back. This directly replaces pull-ups. Stop if left shoulder feels uncomfortable and switch to neutral grip.",
            alts: [
              { name: "Neutral Grip Pulldown", reason: "Even safer for shoulder — palms facing each other" },
              { name: "Straight-arm Pulldown", reason: "Isolates lats without elbow bend" }
            ]
          },
          {
            id: "wed-pull-3",
            name: "Single-Arm Dumbbell Row",
            type: "iso",
            muscle: "Lats · Mid back · Biceps",
            sets: 3, reps: "10–12 each", rest: "60 sec",
            tip: "Brace one hand on bench. Pull elbow to hip. Full stretch at the bottom — don't rush. One of the best back builders.",
            alts: [
              { name: "Chest-Supported Row (machine)", reason: "Removes lower back involvement" },
              { name: "Meadows Row", reason: "Landmine version, great range of motion" }
            ]
          },
          {
            id: "wed-pull-4",
            name: "Face Pulls (Cable)",
            type: "iso",
            muscle: "Rear delts · Rotator cuff · Traps",
            sets: 3, reps: "15–20", rest: "45 sec",
            tip: "Cable at face height, rope attachment. Pull to ears with elbows high and wide. This exercise directly rehabilitates your left shoulder over time — never skip it.",
            alts: [
              { name: "Band Face Pull", reason: "Resistance band version for home" },
              { name: "Rear Delt Fly (dumbbell)", reason: "Lying face down on bench, arms out wide" },
              { name: "Reverse Pec Deck", reason: "Machine version, very controlled" }
            ]
          },
          {
            id: "wed-pull-5",
            name: "Barbell Curl",
            type: "iso",
            muscle: "Biceps",
            sets: 3, reps: "10–12", rest: "60 sec",
            tip: "Elbows pinned to sides. Full extension at the bottom, full contraction at the top. Don't swing — zero momentum.",
            alts: [
              { name: "EZ Bar Curl", reason: "Less wrist strain than straight bar" },
              { name: "Dumbbell Curl (alternating)", reason: "Better mind-muscle connection each arm" },
              { name: "Cable Curl", reason: "Constant tension throughout the movement" }
            ]
          },
          {
            id: "wed-pull-6",
            name: "Hammer Curl (Dumbbell)",
            type: "iso",
            muscle: "Brachialis · Biceps · Forearms",
            sets: 2, reps: "12–15", rest: "45 sec",
            tip: "Neutral grip (thumbs up). Adds thickness to the upper arm. Alternate arms or do both together.",
            alts: [
              { name: "Cross-body Hammer Curl", reason: "Brings the dumbbell across — hits brachialis harder" },
              { name: "Rope Hammer Curl (cable)", reason: "Constant tension version" }
            ]
          }
        ]
      }
    ]
  },
  {
    name: "Thursday — Cardio",
    sub: "Fat burn · Zone 2 · Active recovery",
    duration: "35–40 min",
    type: "cardio",
    isCardio: true,
    warmup: "5 min very easy warm-up at lowest intensity before starting",
    injuryNote: "Rowing machine: only use if left shoulder feels good that day.",
    cardioOptions: [
      {
        id: "thu-cardio-0",
        name: "🏃 Incline Treadmill Walk",
        type: "cardio",
        muscle: "Full body",
        badge: "Best for fat loss",
        details: "35 min · 8–12% incline · 5–6 km/h",
        tip: "Don't hold the rails — defeats the purpose. Best option: burns 300–400 kcal, zero joint stress, doesn't spike appetite.",
        alts: []
      },
      {
        id: "thu-cardio-1",
        name: "🚴 Stationary Bike",
        type: "cardio",
        muscle: "Lower body",
        badge: "Low impact",
        details: "35 min · Moderate resistance · 75–90 RPM",
        tip: "You should be able to talk but not sing — that's Zone 2. Alternate 3 min easy / 1 min slightly harder to keep it interesting.",
        alts: []
      },
      {
        id: "thu-cardio-2",
        name: "🚣 Rowing Machine",
        type: "cardio",
        muscle: "Full body",
        badge: "Full body",
        details: "25 min · 2:20–2:40 split · Damper 4–5",
        tip: "Drive with legs first (60% of power), lean back, then pull arms. Only use if left shoulder feels good — it's a pulling movement.",
        alts: []
      }
    ]
  },
  {
    name: "Friday — Push",
    sub: "Chest · Shoulders · Triceps · Hypertrophy focus",
    duration: "45 min",
    type: "strength",
    exercises: 7,
    sets: 24,
    warmup: "5 min — shoulder rotations, band pull-aparts, 2×15 push-ups",
    injuryNote: "Left shoulder: avoid parallel bar dips. Use bench dips or machine instead.",
    sections: [
      {
        label: "Compounds",
        exercises: [
          {
            id: "fri-push-0",
            name: "Dumbbell Bench Press",
            type: "compound",
            muscle: "Chest · Front delts · Triceps",
            sets: 4, reps: "10–12", rest: "90 sec",
            tip: "Lighter than Monday's barbell work. More stretch at the bottom with dumbbells. Last set push close to failure. This is hypertrophy day — slow tempo, feel the muscle.",
            alts: [
              { name: "Barbell Bench Press", reason: "Can swap if Monday felt too light" },
              { name: "Machine Chest Press", reason: "Great for high reps and full fatigue" }
            ]
          },
          {
            id: "fri-push-1",
            name: "Arnold Press (Dumbbell)",
            type: "compound",
            muscle: "All 3 shoulder heads · Triceps",
            sets: 3, reps: "10–12", rest: "90 sec",
            tip: "Start with palms facing you, rotate to palms forward as you press up. Hits all 3 heads. Slower and more deliberate than a standard press.",
            alts: [
              { name: "Lateral Raise + Front Raise superset", reason: "Hits same muscle groups separately" },
              { name: "Seated DB Press", reason: "Standard shoulder press if Arnold feels awkward" }
            ]
          }
        ]
      },
      {
        label: "Accessories",
        exercises: [
          {
            id: "fri-push-2",
            name: "Decline Push-Up (feet elevated)",
            type: "iso",
            muscle: "Upper chest · Triceps",
            sets: 3, reps: "15–20", rest: "45 sec",
            tip: "Feet on a bench. Great pump exercise and very easy on the shoulder. Add a weight plate on your back if too easy.",
            alts: [
              { name: "Incline Cable Fly", reason: "More tension, better isolation" },
              { name: "Standard Push-Up", reason: "Easier version if decline is too hard" }
            ]
          },
          {
            id: "fri-push-3",
            name: "Cable Lateral Raise",
            type: "iso",
            muscle: "Side delts",
            sets: 4, reps: "15–20", rest: "45 sec",
            tip: "Cable keeps tension at the bottom unlike dumbbells. Do each arm separately. 4 sets — side delts respond well to volume.",
            alts: [
              { name: "Dumbbell Lateral Raise", reason: "Standard version, works well" },
              { name: "Machine Lateral Raise", reason: "Controlled path, great for pump" }
            ]
          },
          {
            id: "fri-push-4",
            name: "Machine Chest Press",
            type: "iso",
            muscle: "Chest · Triceps",
            sets: 3, reps: "12–15", rest: "45 sec",
            tip: "Good finishing move. Controlled movement, focus on the squeeze. Do a drop set on the last set — reduce weight by 20% and go to failure.",
            alts: [
              { name: "Smith Machine Press", reason: "Fixed path, good for high-rep burnout" },
              { name: "Push-Up to failure", reason: "Bodyweight burnout to finish chest" }
            ]
          },
          {
            id: "fri-push-5",
            name: "Tricep Bench Dips",
            type: "iso",
            muscle: "Triceps · Chest",
            sets: 3, reps: "12–15", rest: "45 sec",
            tip: "Hands on bench behind you, feet on floor. Keep elbows tucked. Avoid parallel bar dips — too much shoulder stress with your injury.",
            alts: [
              { name: "Tricep Pushdown (bar)", reason: "Easier on shoulder, good alternative" },
              { name: "Diamond Push-Up", reason: "Hands close together — tricep focused" }
            ]
          },
          {
            id: "fri-push-6",
            name: "Cable Tricep Kickback",
            type: "iso",
            muscle: "Tricep lateral head",
            sets: 2, reps: "15", rest: "45 sec",
            tip: "Light weight, full lockout at the top. Great finisher for the tricep pump. Lean slightly forward, upper arm parallel to floor.",
            alts: [
              { name: "Dumbbell Kickback", reason: "Same movement without cable machine" },
              { name: "Overhead Cable Extension", reason: "More long head involvement" }
            ]
          }
        ]
      }
    ]
  },
  {
    name: "Saturday — Legs",
    sub: "Glutes · Hamstrings · Posterior chain focus",
    duration: "45 min",
    type: "strength",
    exercises: 7,
    sets: 23,
    warmup: "5 min — glute bridges ×15, hip circles, leg swings, 10 bodyweight squats",
    injuryNote: undefined,
    sections: [
      {
        label: "Compounds",
        exercises: [
          {
            id: "sat-legs-0",
            name: "Sumo Deadlift",
            type: "compound",
            muscle: "Glutes · Hamstrings · Quads · Lower back",
            sets: 4, reps: "6–8", rest: "2 min",
            tip: "Wide stance, toes pointed out. Drive knees out over toes. Hits glutes harder than conventional deadlift. 1 warm-up set at 60% first.",
            alts: [
              { name: "Conventional Deadlift", reason: "More hamstring, less glute — still excellent" },
              { name: "Trap Bar Deadlift", reason: "Easier to learn, less lower back stress" },
              { name: "Romanian Deadlift", reason: "If lower back is fatigued from the week" }
            ]
          },
          {
            id: "sat-legs-1",
            name: "Bulgarian Split Squat",
            type: "compound",
            muscle: "Quads · Glutes · Balance",
            sets: 3, reps: "10 each leg", rest: "90 sec",
            tip: "Rear foot elevated on bench. Front knee tracks over toes. Brutal but one of the best single-leg movements. Start lighter than you think you need.",
            alts: [
              { name: "Reverse Lunge (dumbbell)", reason: "Less intense version, same muscle pattern" },
              { name: "Step-Ups", reason: "Lower skill, still very effective for glutes" },
              { name: "Single-leg Leg Press", reason: "Machine version — safer and easier" }
            ]
          }
        ]
      },
      {
        label: "Accessories",
        exercises: [
          {
            id: "sat-legs-2",
            name: "Hip Thrust (Barbell)",
            type: "iso",
            muscle: "Glutes (maximum activation)",
            sets: 4, reps: "12–15", rest: "60 sec",
            tip: "Upper back on bench, bar across hips (use a pad). Squeeze glutes hard at the top. Don't hyperextend your lower back — stop at neutral spine.",
            alts: [
              { name: "Dumbbell Hip Thrust", reason: "Easier to set up, same movement" },
              { name: "Glute Bridge (floor)", reason: "Bodyweight version, good for warmup sets" },
              { name: "Cable Pull-Through", reason: "Great glute isolation with constant tension" }
            ]
          },
          {
            id: "sat-legs-3",
            name: "Lying Leg Curl",
            type: "iso",
            muscle: "Hamstrings",
            sets: 3, reps: "12–15", rest: "60 sec",
            tip: "Toes slightly inward to target outer hamstring. Slow eccentric — 2–3 seconds down. Controlled, no swinging.",
            alts: [
              { name: "Seated Leg Curl", reason: "More stretch on hamstring at bottom" },
              { name: "Swiss Ball Leg Curl", reason: "Bodyweight, also hits glutes and core" }
            ]
          },
          {
            id: "sat-legs-4",
            name: "Cable Kickback",
            type: "iso",
            muscle: "Glutes",
            sets: 3, reps: "15 each", rest: "45 sec",
            tip: "Ankle attachment. Keep hips square — don't rotate. Squeeze glute hard at the top. Slow tempo for maximum activation.",
            alts: [
              { name: "Resistance Band Kickback", reason: "Home option, same pattern" },
              { name: "Donkey Kick (floor)", reason: "Bodyweight version on all fours" }
            ]
          },
          {
            id: "sat-legs-5",
            name: "Leg Press (wide stance, low feet)",
            type: "iso",
            muscle: "Glutes · Hamstrings",
            sets: 3, reps: "12–15", rest: "60 sec",
            tip: "Wide stance, feet lower on the platform shifts emphasis to glutes vs quads (different from Tuesday's leg press setup). Go deep for full glute stretch.",
            alts: [
              { name: "Sumo Squat (Dumbbell)", reason: "Goblet sumo squat — same target" },
              { name: "Smith Machine Sumo Squat", reason: "Controlled path version" }
            ]
          },
          {
            id: "sat-legs-6",
            name: "Seated Calf Raise",
            type: "iso",
            muscle: "Soleus (inner calf)",
            sets: 3, reps: "15–20", rest: "45 sec",
            tip: "Different muscle to standing calf raise. Full stretch at bottom, full contraction at top. Doing both standing (Tuesday) and seated (Saturday) builds a complete calf.",
            alts: [
              { name: "Standing Calf Raise", reason: "Can substitute if seated machine unavailable" },
              { name: "Single-leg Calf Raise (BW)", reason: "Bodyweight version on a step" }
            ]
          }
        ]
      }
    ]
  },
  {
    name: "Sunday — Rest",
    sub: "Recovery · Sleep · Eat your protein",
    duration: "—",
    type: "rest",
    isRest: true
  }
]
