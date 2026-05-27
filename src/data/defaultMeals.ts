import type { MealDay } from '@/types/meals'

export const DAYS: MealDay[] = [
  {
    name: "Monday",
    macros: { kcal: 2140, protein: 172, carbs: 218, fat: 63 },
    meals: [
      {
        id: "mon-0",
        icon: "🍳", name: "Breakfast", time: "7:00 – 8:00 AM", kcal: 530,
        protein: 0, carbs: 0, fat: 0,
        ingredients: [
          { name: "5 whole eggs", macro: "30g P · 25g F" },
          { name: "2 slices wholegrain toast", macro: "6g P · 28g C" },
          { name: "1 banana", macro: "1g P · 27g C" },
          { name: "Black coffee", macro: "—" }
        ],
        steps: [
          { text: "Crack all 5 eggs into a bowl. Add a pinch of salt and pepper. Whisk well.", tip: null },
          { text: "Heat a non-stick pan on medium heat. Add a small knob of butter or spray with cooking oil.", tip: null },
          { text: "Pour in the eggs. Using a spatula, gently fold from the edges toward the centre — don't stir too fast. Remove from heat while still slightly wet; residual heat finishes them.", tip: "Pro tip: Lower heat = creamier eggs. High heat = rubbery eggs." },
          { text: "Toast the bread. Serve eggs on the side with the banana. Make your coffee.", tip: null }
        ]
      },
      {
        id: "mon-1",
        icon: "🍗", name: "Lunch", time: "12:30 PM", kcal: 580,
        protein: 0, carbs: 0, fat: 0,
        ingredients: [
          { name: "200g chicken breast", macro: "44g P · 5g F" },
          { name: "150g white rice (cooked)", macro: "3g P · 40g C" },
          { name: "1 tbsp olive oil", macro: "14g F" },
          { name: "1 apple", macro: "0g P · 21g C" }
        ],
        steps: [
          { text: "Pat chicken dry with paper towel. Season generously with salt, pepper, garlic powder, and paprika on both sides.", tip: null },
          { text: "Heat a pan on medium-high. Add olive oil. Once hot, place chicken in the pan — it should sizzle.", tip: null },
          { text: "Cook 5–6 min on first side without moving. Flip. Cook 4–5 min more. Breast is done when the thickest part reads 74°C or juices run clear.", tip: "Pro tip: Let it rest 3 min before slicing — keeps it juicy." },
          { text: "Cook rice according to packet (usually 1 cup rice : 2 cups water, 15 min simmering). Serve chicken sliced over rice. Drizzle remaining olive oil.", tip: null }
        ]
      },
      {
        id: "mon-2",
        icon: "🥛", name: "Snack", time: "3:30 PM", kcal: 210,
        protein: 0, carbs: 0, fat: 0,
        ingredients: [
          { name: "200g Greek yogurt (0%)", macro: "20g P · 8g C" },
          { name: "1 tbsp honey", macro: "0g P · 17g C" }
        ],
        steps: [
          { text: "Spoon Greek yogurt into a bowl. Drizzle honey over the top. Done — no cooking needed.", tip: "Tip: Prep this the night before in a small container to grab on the go." }
        ]
      },
      {
        id: "mon-3",
        icon: "🍌", name: "Pre-Workout", time: "5:30 PM", kcal: 230,
        protein: 0, carbs: 0, fat: 0,
        ingredients: [
          { name: "1 scoop whey protein + water", macro: "25g P · 3g C" },
          { name: "1 banana", macro: "1g P · 27g C" }
        ],
        steps: [
          { text: "Add 1 scoop whey to a shaker with 250–300ml cold water. Shake for 10 seconds.", tip: null },
          { text: "Eat banana alongside the shake 45–60 min before your workout.", tip: "Tip: The banana provides fast carbs for energy; the shake pre-loads protein synthesis." }
        ]
      },
      {
        id: "mon-4",
        icon: "🐟", name: "Dinner", time: "8:00 PM", kcal: 590,
        protein: 0, carbs: 0, fat: 0,
        ingredients: [
          { name: "200g salmon fillet", macro: "40g P · 20g F" },
          { name: "250g sweet potato", macro: "4g P · 50g C" },
          { name: "1 tsp butter", macro: "4g F" }
        ],
        steps: [
          { text: "Preheat oven to 200°C. Pierce sweet potato with a fork several times. Place directly on oven rack or a baking tray. Bake 40–45 min until soft when pressed.", tip: null },
          { text: "Pat salmon dry. Season with salt, pepper, and a squeeze of lemon if you have it.", tip: null },
          { text: "Heat a pan on high heat. Add a little oil. Place salmon skin-side DOWN. Press gently for 1 min to stop curling. Cook 4 min, then flip. Cook 2–3 min more. Salmon is done when it flakes easily with a fork.", tip: "Pro tip: Don't move the salmon while the skin crisps — patience gives you perfect skin." },
          { text: "Cut sweet potato open, add butter, serve with the salmon.", tip: null }
        ]
      }
    ]
  },
  {
    name: "Tuesday",
    macros: { kcal: 2160, protein: 169, carbs: 222, fat: 65 },
    meals: [
      {
        id: "tue-0",
        icon: "🥣", name: "Breakfast", time: "7:00 – 8:00 AM", kcal: 510,
        protein: 0, carbs: 0, fat: 0,
        ingredients: [
          { name: "100g oats (dry)", macro: "13g P · 60g C · 7g F" },
          { name: "1 scoop whey protein", macro: "25g P · 3g C" },
          { name: "1 tbsp peanut butter", macro: "4g P · 3g C · 8g F" },
          { name: "Handful blueberries", macro: "1g P · 10g C" }
        ],
        steps: [
          { text: "Add oats to a bowl. Pour in 200–250ml boiling water (or microwave oats + water 2.5 min on high). Stir well.", tip: null },
          { text: "Let cool for 2 minutes. Stir in whey protein powder until smooth — don't add to boiling oats or it clumps.", tip: "Tip: Stir vigorously or use a fork to avoid lumps." },
          { text: "Top with peanut butter and blueberries. Eat immediately.", tip: null }
        ]
      },
      {
        id: "tue-1",
        icon: "🍝", name: "Lunch", time: "12:30 PM", kcal: 600,
        protein: 0, carbs: 0, fat: 0,
        ingredients: [
          { name: "200g lean beef mince", macro: "40g P · 18g F" },
          { name: "200g pasta (cooked)", macro: "7g P · 50g C" },
          { name: "Smooth tomato pasta sauce", macro: "2g P · 10g C" }
        ],
        steps: [
          { text: "Boil pasta in salted water according to packet (usually 8–10 min). Drain and set aside.", tip: null },
          { text: "Brown beef mince in a pan on high heat — don't stir too early, let it brown properly. Break up with a spatula.", tip: null },
          { text: "Once no pink remains, drain excess fat if any. Pour in smooth tomato sauce. Stir and simmer 5 min.", tip: "Tip: Use 'passata' from AH — completely smooth, no vegetable chunks." },
          { text: "Combine with pasta. Season with salt, pepper, and a pinch of dried oregano.", tip: null }
        ]
      },
      {
        id: "tue-2",
        icon: "🧀", name: "Snack", time: "3:30 PM", kcal: 180,
        protein: 0, carbs: 0, fat: 0,
        ingredients: [
          { name: "200g cottage cheese", macro: "20g P · 6g C · 5g F" },
          { name: "2 rice cakes", macro: "1g P · 14g C" }
        ],
        steps: [
          { text: "Spoon cottage cheese into a bowl. Eat with rice cakes on the side — no cooking needed.", tip: "Tip: Add a pinch of salt and black pepper to the cottage cheese to make it more flavourful." }
        ]
      },
      {
        id: "tue-3",
        icon: "🍌", name: "Pre-Workout", time: "5:30 PM", kcal: 260,
        protein: 0, carbs: 0, fat: 0,
        ingredients: [
          { name: "1 scoop whey protein", macro: "25g P · 3g C" },
          { name: "2 rice cakes + 1 tsp honey", macro: "1g P · 34g C" }
        ],
        steps: [
          { text: "Shake whey with 300ml cold water. Drizzle honey over rice cakes.", tip: null }
        ]
      },
      {
        id: "tue-4",
        icon: "🍗", name: "Dinner", time: "8:00 PM", kcal: 610,
        protein: 0, carbs: 0, fat: 0,
        ingredients: [
          { name: "250g chicken thighs", macro: "43g P · 18g F" },
          { name: "300g baked potato", macro: "4g P · 60g C" },
          { name: "1 tbsp sour cream", macro: "1g C · 3g F" }
        ],
        steps: [
          { text: "Preheat oven to 200°C. Pierce potato with a fork multiple times. Rub with a tiny bit of oil and salt. Bake directly on oven rack for 50–60 min.", tip: null },
          { text: "Season chicken thighs with salt, pepper, garlic powder, and paprika. Place skin-side up in a baking dish.", tip: null },
          { text: "Bake thighs at 200°C for 30–35 min. They're done when skin is golden brown and internal temp is 74°C.", tip: "Tip: Thighs are more forgiving than breast — hard to dry out. Great for beginners." },
          { text: "Cut potato open, add sour cream, serve alongside chicken.", tip: null }
        ]
      }
    ]
  },
  {
    name: "Wednesday",
    macros: { kcal: 2130, protein: 171, carbs: 215, fat: 62 },
    meals: [
      {
        id: "wed-0",
        icon: "🍳", name: "Breakfast", time: "7:00 – 8:00 AM", kcal: 490,
        protein: 0, carbs: 0, fat: 0,
        ingredients: [
          { name: "4 eggs + 3 egg whites (omelette)", macro: "33g P · 20g F" },
          { name: "2 slices wholegrain toast", macro: "6g P · 28g C" },
          { name: "1 orange", macro: "1g P · 15g C" }
        ],
        steps: [
          { text: "Separate 3 eggs — keep only the whites. Mix with 4 whole eggs in a bowl. Season with salt and pepper.", tip: null },
          { text: "Heat a non-stick pan on medium. Add a little butter or oil. Pour in the egg mix.", tip: null },
          { text: "Cook until the bottom sets (2–3 min). Fold in half or roll the omelette. Slide onto plate.", tip: "Tip: Add grated cheddar inside for a cheese omelette — adds protein and flavour." },
          { text: "Toast bread. Eat omelette with toast and orange on the side.", tip: null }
        ]
      },
      {
        id: "wed-1",
        icon: "🐟", name: "Lunch", time: "12:30 PM", kcal: 570,
        protein: 0, carbs: 0, fat: 0,
        ingredients: [
          { name: "200g tuna steak", macro: "44g P · 6g F" },
          { name: "150g rice (cooked)", macro: "3g P · 40g C" },
          { name: "1 tbsp soy sauce + 1 tsp sesame oil", macro: "1g P · 5g F" },
          { name: "1 apple", macro: "0g P · 21g C" }
        ],
        steps: [
          { text: "Cook rice. Pat tuna steak dry. Season with salt and pepper.", tip: null },
          { text: "Heat a pan until very hot. Add a little oil. Sear tuna 1.5–2 min each side — it should be slightly pink in the centre.", tip: "Tip: Tuna dries out when overcooked. Pink centre = perfect. Fully white = too far." },
          { text: "Slice tuna and serve over rice. Drizzle soy sauce and sesame oil over the top.", tip: null }
        ]
      },
      {
        id: "wed-2",
        icon: "🫙", name: "Snack", time: "3:30 PM", kcal: 200,
        protein: 0, carbs: 0, fat: 0,
        ingredients: [
          { name: "200g Greek yogurt", macro: "20g P · 8g C" },
          { name: "Handful of strawberries", macro: "1g P · 12g C" }
        ],
        steps: [
          { text: "Slice strawberries and mix into Greek yogurt. Done.", tip: null }
        ]
      },
      {
        id: "wed-3",
        icon: "🍌", name: "Pre-Workout", time: "5:30 PM", kcal: 230,
        protein: 0, carbs: 0, fat: 0,
        ingredients: [
          { name: "1 scoop whey protein", macro: "25g P · 3g C" },
          { name: "1 banana", macro: "1g P · 27g C" }
        ],
        steps: [
          { text: "Shake whey with cold water. Eat banana alongside.", tip: null }
        ]
      },
      {
        id: "wed-4",
        icon: "🥩", name: "Dinner", time: "8:00 PM", kcal: 640,
        protein: 0, carbs: 0, fat: 0,
        ingredients: [
          { name: "300g sirloin steak", macro: "45g P · 22g F" },
          { name: "250g sweet potato (mashed)", macro: "4g P · 50g C" },
          { name: "1 tsp butter", macro: "4g F" }
        ],
        steps: [
          { text: "Remove steak from fridge 20 min before cooking — cooking cold steak leads to uneven results.", tip: null },
          { text: "Boil or microwave sweet potato until very soft. Drain, add butter, mash with a fork.", tip: null },
          { text: "Season steak generously with salt and pepper on both sides. Heat a cast iron or heavy pan until smoking hot. Add a drop of oil.", tip: null },
          { text: "Sear steak 2.5–3 min each side for medium (adjust to preference). For 300g sirloin: 2 min = rare, 3 min = medium, 4 min = well done.", tip: "Pro tip: Don't press the steak down. Let it sear undisturbed for the best crust." },
          { text: "Rest steak 3 min before cutting. Serve with mashed sweet potato.", tip: null }
        ]
      }
    ]
  },
  {
    name: "Thursday",
    macros: { kcal: 2120, protein: 168, carbs: 220, fat: 60 },
    meals: [
      {
        id: "thu-0",
        icon: "🥣", name: "Breakfast", time: "7:00 – 8:00 AM", kcal: 520,
        protein: 0, carbs: 0, fat: 0,
        ingredients: [
          { name: "200g Greek yogurt", macro: "20g P · 8g C" },
          { name: "1 scoop whey protein (mixed in)", macro: "25g P · 3g C" },
          { name: "60g granola", macro: "4g P · 38g C · 8g F" },
          { name: "Handful blueberries", macro: "1g P · 10g C" }
        ],
        steps: [
          { text: "Mix whey protein into Greek yogurt using a fork — stir well to avoid lumps.", tip: "Tip: Add a splash of water to help it mix in more smoothly." },
          { text: "Top with granola and blueberries. Eat immediately (granola gets soggy if left).", tip: null }
        ]
      },
      {
        id: "thu-1",
        icon: "🌯", name: "Lunch", time: "12:30 PM", kcal: 560,
        protein: 0, carbs: 0, fat: 0,
        ingredients: [
          { name: "2 tortilla wraps", macro: "8g P · 50g C · 4g F" },
          { name: "160g cooked chicken", macro: "38g P · 5g F" },
          { name: "30g cheddar cheese", macro: "7g P · 10g F" }
        ],
        steps: [
          { text: "Slice or shred leftover cooked chicken breast (meal prep from Sunday saves time here).", tip: null },
          { text: "Lay wrap flat. Add chicken and grated cheddar down the centre. Add mustard or mayo if desired.", tip: null },
          { text: "Fold the bottom up, then roll tightly from one side. Toast in a dry pan for 1–2 min per side for a crispy wrap.", tip: "Tip: This is the fastest high-protein lunch — uses meal-prepped chicken, takes 3 minutes." }
        ]
      },
      {
        id: "thu-2",
        icon: "🍎", name: "Snack", time: "3:30 PM", kcal: 200,
        protein: 0, carbs: 0, fat: 0,
        ingredients: [
          { name: "200g cottage cheese", macro: "20g P · 6g C · 5g F" },
          { name: "1 apple", macro: "0g P · 21g C" }
        ],
        steps: [
          { text: "Eat cottage cheese with sliced apple on the side.", tip: null }
        ]
      },
      {
        id: "thu-3",
        icon: "🍌", name: "Pre-Workout", time: "5:30 PM", kcal: 230,
        protein: 0, carbs: 0, fat: 0,
        ingredients: [
          { name: "1 scoop whey protein", macro: "25g P · 3g C" },
          { name: "1 banana", macro: "1g P · 27g C" }
        ],
        steps: [
          { text: "Shake whey with cold water. Eat with banana.", tip: null }
        ]
      },
      {
        id: "thu-4",
        icon: "🍤", name: "Dinner", time: "8:00 PM", kcal: 610,
        protein: 0, carbs: 0, fat: 0,
        ingredients: [
          { name: "200g shrimp (peeled)", macro: "38g P · 3g F" },
          { name: "200g pasta (cooked)", macro: "7g P · 50g C" },
          { name: "1 tbsp olive oil + garlic + lemon", macro: "14g F" }
        ],
        steps: [
          { text: "Cook pasta. Meanwhile, heat olive oil in a pan over medium-high heat.", tip: null },
          { text: "Add 2 crushed garlic cloves to the oil. Cook 30 seconds until fragrant — don't burn.", tip: null },
          { text: "Add shrimp in a single layer. Cook 1.5–2 min per side until pink and curled. Shrimp overcooks fast — pull as soon as they curl into a C shape.", tip: "Tip: Straight shrimp = undercooked. C-shape = perfect. O-shape = overcooked." },
          { text: "Toss shrimp and oil with drained pasta. Squeeze lemon juice over, season with salt and pepper.", tip: null }
        ]
      }
    ]
  },
  {
    name: "Friday",
    macros: { kcal: 2170, protein: 173, carbs: 224, fat: 64 },
    meals: [
      {
        id: "fri-0",
        icon: "🥣", name: "Breakfast", time: "7:00 – 8:00 AM", kcal: 540,
        protein: 0, carbs: 0, fat: 0,
        ingredients: [
          { name: "100g oats + 1 scoop whey", macro: "38g P · 63g C · 9g F" },
          { name: "1 tbsp almond butter", macro: "3g P · 3g C · 9g F" },
          { name: "1 banana", macro: "1g P · 27g C" }
        ],
        steps: [
          { text: "Cook oats with 200ml water or milk in microwave (2.5 min). Let cool slightly.", tip: null },
          { text: "Stir in whey powder and almond butter until smooth.", tip: "Tip: Almond butter mixes better when oats are still warm but not boiling." },
          { text: "Slice banana on top. Serve immediately.", tip: null }
        ]
      },
      {
        id: "fri-1",
        icon: "🦃", name: "Lunch", time: "12:30 PM", kcal: 570,
        protein: 0, carbs: 0, fat: 0,
        ingredients: [
          { name: "200g turkey breast slices", macro: "44g P · 2g F" },
          { name: "2 wholegrain wraps", macro: "8g P · 50g C · 4g F" },
          { name: "1 tbsp hummus + mustard", macro: "2g P · 5g C · 3g F" }
        ],
        steps: [
          { text: "Lay wraps flat. Spread hummus and mustard on each.", tip: null },
          { text: "Add sliced turkey. Roll tightly and slice in half diagonally.", tip: "Tip: Cold turkey wraps = fastest lunch of the week. Literally 2 minutes, zero cooking." }
        ]
      },
      {
        id: "fri-2",
        icon: "🫙", name: "Snack", time: "3:30 PM", kcal: 210,
        protein: 0, carbs: 0, fat: 0,
        ingredients: [
          { name: "200g Greek yogurt + honey", macro: "20g P · 25g C · 1g F" }
        ],
        steps: [
          { text: "Mix yogurt with honey. Done.", tip: null }
        ]
      },
      {
        id: "fri-3",
        icon: "🍌", name: "Pre-Workout", time: "5:30 PM", kcal: 240,
        protein: 0, carbs: 0, fat: 0,
        ingredients: [
          { name: "1 scoop whey + banana + rice cake", macro: "27g P · 57g C · 2g F" }
        ],
        steps: [
          { text: "Shake whey with cold water. Eat banana and rice cake 45 min before training.", tip: null }
        ]
      },
      {
        id: "fri-4",
        icon: "🐟", name: "Dinner", time: "8:00 PM", kcal: 610,
        protein: 0, carbs: 0, fat: 0,
        ingredients: [
          { name: "200g salmon", macro: "40g P · 20g F" },
          { name: "150g rice (cooked)", macro: "3g P · 40g C" },
          { name: "1 tbsp teriyaki sauce", macro: "1g P · 8g C" }
        ],
        steps: [
          { text: "Cook rice. Pat salmon dry and season with salt and pepper.", tip: null },
          { text: "Heat pan on high. Add oil. Salmon skin-side down. Press gently for 1 min. Cook 4 min, flip, cook 2–3 min.", tip: null },
          { text: "In the last minute of cooking, brush teriyaki sauce over the top of the salmon.", tip: "Tip: Teriyaki has sugar — add it late or it burns. Don't add it to the pan early." },
          { text: "Serve over rice. Drizzle any remaining teriyaki over the bowl.", tip: null }
        ]
      }
    ]
  },
  {
    name: "Saturday",
    macros: { kcal: 2150, protein: 170, carbs: 218, fat: 65 },
    meals: [
      {
        id: "sat-0",
        icon: "🍳", name: "Breakfast", time: "7:00 – 8:00 AM", kcal: 550,
        protein: 0, carbs: 0, fat: 0,
        ingredients: [
          { name: "4 eggs + 50g cheddar (omelette)", macro: "37g P · 30g F" },
          { name: "2 slices wholegrain toast", macro: "6g P · 28g C" },
          { name: "1 apple", macro: "0g P · 21g C" }
        ],
        steps: [
          { text: "Crack 4 eggs into a bowl. Season with salt and pepper. Grate cheddar.", tip: null },
          { text: "Heat pan on medium. Add butter. Pour in eggs. Cook 2 min until bottom sets.", tip: null },
          { text: "Sprinkle cheddar over half the omelette. Fold the other half over. Cook 1 more min.", tip: "Tip: The cheese melts from the steam inside — you don't need to open it back up." },
          { text: "Serve with toast and apple.", tip: null }
        ]
      },
      {
        id: "sat-1",
        icon: "🍗", name: "Lunch", time: "12:30 PM", kcal: 560,
        protein: 0, carbs: 0, fat: 0,
        ingredients: [
          { name: "200g chicken breast", macro: "44g P · 5g F" },
          { name: "300g baked potato", macro: "4g P · 60g C" },
          { name: "1 tbsp olive oil", macro: "14g F" }
        ],
        steps: [
          { text: "Bake potato as per Wednesday method (50–60 min at 200°C) or microwave 8–10 min, flipping halfway.", tip: "Tip: Microwave potato is 80% as good and takes 9 minutes. Great for quick lunch." },
          { text: "Cook chicken breast as per Monday method. Slice and serve over opened potato with olive oil drizzled.", tip: null }
        ]
      },
      {
        id: "sat-2",
        icon: "🫙", name: "Snack", time: "3:30 PM", kcal: 200,
        protein: 0, carbs: 0, fat: 0,
        ingredients: [
          { name: "200g Greek yogurt + berries", macro: "20g P · 18g C · 1g F" }
        ],
        steps: [
          { text: "Mix yogurt with any berries you have. Done.", tip: null }
        ]
      },
      {
        id: "sat-3",
        icon: "🍌", name: "Pre-Workout", time: "5:30 PM", kcal: 230,
        protein: 0, carbs: 0, fat: 0,
        ingredients: [
          { name: "1 scoop whey + 1 banana", macro: "26g P · 30g C · 2g F" }
        ],
        steps: [
          { text: "Shake whey with cold water. Eat banana 45 min before training.", tip: null }
        ]
      },
      {
        id: "sat-4",
        icon: "🍝", name: "Dinner", time: "8:00 PM", kcal: 610,
        protein: 0, carbs: 0, fat: 0,
        ingredients: [
          { name: "250g lean beef mince (bolognese)", macro: "43g P · 20g F" },
          { name: "200g pasta (cooked)", macro: "7g P · 50g C" },
          { name: "Smooth tomato sauce (passata)", macro: "2g P · 10g C" }
        ],
        steps: [
          { text: "Brown mince in a hot pan. Break it up well. Drain excess fat.", tip: null },
          { text: "Add passata sauce. Season with salt, pepper, dried basil, and a pinch of sugar to balance acidity.", tip: null },
          { text: "Simmer 10 min on low heat — the longer it simmers, the better it tastes.", tip: "Tip: Make double batch of bolognese — it freezes perfectly for up to 3 months." },
          { text: "Cook pasta separately, drain, combine with sauce.", tip: null }
        ]
      }
    ]
  },
  {
    name: "Sunday",
    macros: { kcal: 2140, protein: 168, carbs: 220, fat: 63 },
    meals: [
      {
        id: "sun-0",
        icon: "🥣", name: "Breakfast", time: "7:00 – 8:00 AM", kcal: 520,
        protein: 0, carbs: 0, fat: 0,
        ingredients: [
          { name: "100g oats + 200ml milk", macro: "14g P · 66g C · 8g F" },
          { name: "1 scoop whey protein", macro: "25g P · 3g C" },
          { name: "1 tbsp peanut butter", macro: "4g P · 3g C · 8g F" }
        ],
        steps: [
          { text: "Cook oats with milk (stovetop 5 min, or microwave 2.5 min) — using milk instead of water adds protein and makes it creamier.", tip: null },
          { text: "Let cool slightly. Stir in whey and peanut butter.", tip: "Tip: This is your Sunday meal prep morning. While eating breakfast, start prepping chicken and rice for the week." }
        ]
      },
      {
        id: "sun-1",
        icon: "🌯", name: "Lunch", time: "12:30 PM", kcal: 580,
        protein: 0, carbs: 0, fat: 0,
        ingredients: [
          { name: "200g canned tuna (in water)", macro: "44g P · 2g F" },
          { name: "2 wholegrain wraps", macro: "8g P · 50g C · 4g F" },
          { name: "1 tbsp mayo + mustard", macro: "0g P · 1g C · 10g F" }
        ],
        steps: [
          { text: "Drain tuna well. Mix with mayo and mustard in a bowl. Season with pepper.", tip: "Tip: Press the tin lid down to squeeze out all the water before opening fully." },
          { text: "Spread tuna mix onto wraps. Roll tightly. Toast in a dry pan 1 min each side if desired.", tip: null }
        ]
      },
      {
        id: "sun-2",
        icon: "🧀", name: "Snack", time: "3:30 PM", kcal: 190,
        protein: 0, carbs: 0, fat: 0,
        ingredients: [
          { name: "200g cottage cheese + 1 tbsp honey", macro: "20g P · 22g C · 5g F" }
        ],
        steps: [
          { text: "Mix honey into cottage cheese. Done.", tip: null }
        ]
      },
      {
        id: "sun-3",
        icon: "🍌", name: "Pre-Workout", time: "5:30 PM", kcal: 230,
        protein: 0, carbs: 0, fat: 0,
        ingredients: [
          { name: "1 scoop whey + 1 banana", macro: "26g P · 30g C · 2g F" }
        ],
        steps: [
          { text: "Shake whey with cold water. Eat banana alongside.", tip: null }
        ]
      },
      {
        id: "sun-4",
        icon: "🍗", name: "Dinner", time: "8:00 PM", kcal: 620,
        protein: 0, carbs: 0, fat: 0,
        ingredients: [
          { name: "300g chicken thighs (baked)", macro: "43g P · 18g F" },
          { name: "250g sweet potato", macro: "4g P · 50g C" },
          { name: "1 tbsp olive oil + herbs", macro: "14g F" }
        ],
        steps: [
          { text: "Preheat oven to 200°C. Score chicken thigh skin lightly with a knife — helps fat render and skin crisp.", tip: null },
          { text: "Rub chicken with olive oil, salt, pepper, garlic powder, and dried thyme or rosemary.", tip: null },
          { text: "Place sweet potato (pierced) and chicken together on a baking tray. Roast 35–40 min.", tip: "Tip: Sunday roast style — everything goes in the oven together. Zero active cooking time." },
          { text: "Check chicken: skin should be golden and crispy, internal temp 74°C. Serve together.", tip: null }
        ]
      }
    ]
  }
]
