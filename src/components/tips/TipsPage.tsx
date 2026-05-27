interface TipCard {
  title: string
  content: string
}

interface TipSection {
  label: string
  cards: TipCard[]
}

const TIPS: TipSection[] = [
  {
    label: "🔥 Fat Loss",
    cards: [
      {
        title: "📉 Your deficit is everything",
        content: "You're eating ~2,150 kcal vs a ~2,650 kcal maintenance. That 500 kcal daily deficit = 0.5kg fat lost per week. Miss your calories by 300 kcal (a peanut butter snack here, extra rice there) and your loss can drop to 0.2kg/week. The numbers matter. Track for at least 4 weeks.",
      },
      {
        title: "⚖️ How to weigh yourself correctly",
        content: "Daily weight fluctuates 1–2kg from water, food, and salt — don't panic. Weigh every morning after using the toilet, before eating. Track the weekly average, not individual days. If your weekly average drops 0.3–0.6kg, you're on track. Less than that for 2 weeks in a row → drop 150 kcal or add 20 min walking.",
      },
      {
        title: "💤 Sleep or stay fat",
        content: "Bad sleep (under 6 hrs) raises cortisol and ghrelin — the hunger hormone. Studies show sleep-deprived people eat 300–500 extra kcal per day without realising. 7–9 hours is non-negotiable for fat loss. It's as important as the diet.",
      },
      {
        title: "🍽️ Eat protein first, carbs last",
        content: "At every meal, eat your protein source first. Protein blunts hunger hormones faster than carbs or fat. By the time you get to the rice or potato, you'll naturally eat less of it — without counting.",
      },
      {
        title: "🧂 Water weight is not fat",
        content: "High-sodium days, high-carb days, and stress can add 1–2kg of water retention overnight. This is not fat. Don't change your plan based on one bad weigh-in. Drink 2.5–3L of water daily — it actually helps flush water retention.",
      },
    ],
  },
  {
    label: "👟 Steps & NEAT",
    cards: [
      {
        title: "👟 Steps are your secret weapon",
        content: "NEAT (Non-Exercise Activity Thermogenesis) — the calories burned just moving around — can be 300–600 kcal/day. At 85kg, each 1,000 steps burns roughly 40–50 kcal. Hitting 10,000 steps daily vs 3,000 = ~300 extra kcal burned with zero effort. This can be the difference between losing 0.3kg/week and 0.6kg/week.",
      },
      {
        title: "📍 How to hit 10,000 steps in Rotterdam",
        content: "Walk to the supermarket instead of cycling. Take the stairs always. Walk during phone calls. Park further away. A 20 min walk after dinner = ~2,000 steps and also improves blood sugar control after eating. Use your Garmin to track — set a daily step goal alert.",
      },
      {
        title: "🚶 Post-meal walks = double benefit",
        content: "A 10–15 min walk after your two biggest meals (lunch and dinner) lowers the blood sugar spike from carbs, which reduces fat storage and keeps energy stable. It also adds ~2,500 steps per day without any dedicated workout time.",
      },
    ],
  },
  {
    label: "🔥 Calorie Burn Guide",
    cards: [
      {
        title: "🏋️ How many calories your workouts burn",
        content: "At 85kg, here's a rough estimate per session:\n\nStrength training (45 min) — 250–350 kcal\nCardio incline walk (35 min) — 300–400 kcal\nCycling moderate (35 min) — 350–450 kcal\nRowing machine (25 min) — 300–380 kcal\n\nYour Garmin will give you a personal estimate. Trust your Garmin more than these numbers — it uses your heart rate for accuracy.",
      },
      {
        title: "📊 Track calories burned, not just eaten",
        content: "On heavy training days (legs, push) you burn 250–350 kcal extra. You can eat slightly more on those days — add an extra serving of rice or oats. On rest days (Sunday), stick strictly to 2,150 kcal. This is called calorie cycling and keeps metabolism from adapting.",
      },
      {
        title: "🚴 Best cardio for fat loss at the gym",
        content: "1st choice: Incline treadmill walk — burns fat without spiking appetite or stressing recovery. 8–12% incline, 5–6 km/h, 35 min.\n\n2nd choice: Stationary bike — zero joint impact, good for leg days when already fatigued.\n\nAvoid: long high-intensity runs — they spike hunger, increase cortisol, and eat into muscle if underfueled.",
      },
    ],
  },
  {
    label: "💪 Gym Tips",
    cards: [
      {
        title: "📈 Progressive overload = visible results",
        content: "Every 1–2 weeks, try to add a small amount of weight or 1 more rep to your main lifts. Even 2.5kg more on bench press per month = 30kg stronger in a year. Without progression, your body adapts and stops changing. Log your weights every session — your Garmin can track this.",
      },
      {
        title: "🎯 RPE — how hard should you train?",
        content: "Use RPE (Rate of Perceived Exertion) out of 10. Aim for RPE 7–8 on main lifts — you could do 2 more reps but you choose to stop. RPE 9–10 every session = overtraining and injury risk. RPE 5–6 = not enough stimulus to change. Consistent RPE 7–8 over months = visible body composition change.",
      },
      {
        title: "🫀 Rest times matter more than you think",
        content: "Short rests (30–45 sec) keep heart rate up and burn more calories — great for accessories. Longer rests (90–120 sec) allow full strength recovery for compound lifts. Following the rest times in your workout plan is part of the programme — don't cut them short on compounds or add extra time on accessories.",
      },
      {
        title: "🦺 Left shoulder — what to do and avoid",
        content: "Safe: Face pulls, lateral raises (light), seated DB press, cable work, rows, lat pulldowns.\n\nAvoid: Pull-ups, chin-ups, heavy barbell overhead press, dips with full range, behind-neck anything.\n\nFace pulls 3x/week will actively rehabilitate the shoulder over time — don't skip them. Consider seeing a physio to get a proper diagnosis and timeline for recovery.",
      },
      {
        title: "⏱️ When to expect visible results",
        content: "Week 1–2: 1–2kg drop (mostly water weight from lower carbs + less salt)\nWeek 3–6: Real fat loss starts. Energy stabilises. Pumps improve.\nWeek 8–12: Clothes fit noticeably differently. People comment.\nWeek 16–20: Abs territory — depends on adherence and starting body fat.\n\nDon't judge progress by the mirror in the first 4 weeks. Judge it by the scale average and how your clothes fit.",
      },
    ],
  },
  {
    label: "🍳 Meal Prep",
    cards: [
      {
        title: "🍳 Sunday prep (saves 45 min/day)",
        content: "Cook 1kg chicken breast, 500g rice, and 1kg sweet potato in bulk. Store in containers in the fridge — lasts 4–5 days. Just reheat and eat. Takes 45 min on Sunday and saves you from making bad food choices when hungry and tired after the gym.",
      },
      {
        title: "🥣 Overnight oats trick",
        content: "The night before: mix 100g oats + 1 scoop whey + 200ml milk in a jar. Put it in the fridge. Ready to eat cold in the morning — zero prep time. Saves you 10 minutes every morning.",
      },
      {
        title: "📊 Weigh food before cooking",
        content: "Always weigh ingredients raw, before cooking. Cooked chicken weighs ~25% less than raw. Cooked rice weighs 3x more than dry. If you weigh cooked food you'll either over or underestimate significantly. Raw weight = accurate macros.",
      },
    ],
  },
]

export function TipsPage() {
  return (
    <div style={{ padding: '14px 16px' }}>
      {/* Header */}
      <div style={{ padding: '20px 0 14px', borderBottom: '1px solid var(--border)', marginBottom: 16 }}>
        <h1 style={{ fontFamily: "'Space Grotesk', system-ui, sans-serif", fontSize: 22, fontWeight: 700, color: 'var(--text)' }}>
          Tips & Strategy
        </h1>
        <p style={{ fontSize: 12, color: 'var(--text3)', marginTop: 3 }}>
          Fat loss · Steps · Gym · Calories
        </p>
      </div>

      {TIPS.map((section) => (
        <div key={section.label}>
          <div
            style={{
              fontSize: 10, fontWeight: 600, letterSpacing: '0.10em',
              color: 'var(--text3)', textTransform: 'uppercase',
              margin: '20px 0 10px',
            }}
          >
            {section.label}
          </div>
          {section.cards.map((card) => (
            <div
              key={card.title}
              style={{
                background: 'var(--card)', border: '1px solid var(--edge)',
                borderRadius: 'var(--radius)', padding: '13px 14px', marginBottom: 8,
              }}
            >
              <div
                style={{
                  fontSize: 13, fontWeight: 600, color: 'var(--text)',
                  marginBottom: 7, display: 'flex', alignItems: 'center', gap: 8,
                }}
              >
                {card.title}
              </div>
              <p
                style={{
                  fontSize: 13, color: 'var(--text2)', lineHeight: 1.65,
                  whiteSpace: 'pre-line',
                }}
              >
                {card.content}
              </p>
            </div>
          ))}
        </div>
      ))}
    </div>
  )
}
