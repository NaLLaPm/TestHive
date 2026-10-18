/**
 * THREAD & TREND - Product Catalog & Static Inventory Data
 * Contains 36 complete products across 9 categories.
 */

const PRODUCTS = [
  // --- DRESSES ---
  {
    id: "tt-dr-01",
    name: "Floral Summer Midi Dress",
    category: "Dresses",
    shortDescription: "Breezy floral chiffon midi dress with flutter sleeves and waist tie.",
    fullDescription: "Embrace sun-drenched days with our Floral Summer Midi Dress. Crafted from ultra-lightweight, breathable viscose chiffon with an eco-friendly lining, this dress features subtle flutter sleeves, an empire wrap neckline, and an adjustable waist tie belt that flatters every silhouette. Perfect for garden brunches and evening strolls.",
    price: 1899,
    originalPrice: 2499,
    sizes: ["XS", "S", "M", "L", "XL"],
    colors: [
      { name: "Blush Floral", hex: "#f4c2c2" },
      { name: "Sky Garden", hex: "#b8d5e5" }
    ],
    stock: 18,
    images: [
      "https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1496747611176-843222e1e57c?auto=format&fit=crop&w=800&q=80"
    ],
    rating: 4.8,
    reviewCount: 124,
    tags: ["Best Seller", "Trending"],
    material: "100% Breathable Eco-Viscose",
    care: "Machine wash cold gentle cycle. Do not bleach. Line dry in shade."
  },
  {
    id: "tt-dr-02",
    name: "Sleeveless Linen Tiered Sundress",
    category: "Dresses",
    shortDescription: "Relaxed silhouette crafted from premium washed French linen.",
    fullDescription: "The quintessential warm-weather staple. Made with 100% washed French flax linen, this relaxed tiered sundress drapes comfortably while offering maximum breathability. Features convenient side seam pockets and delicate mother-of-pearl buttons at the back nape.",
    price: 2299,
    originalPrice: 2999,
    sizes: ["S", "M", "L", "XL"],
    colors: [
      { name: "Warm Cream", hex: "#FDFBF7" },
      { name: "Earthy Terracotta", hex: "#C86D51" },
      { name: "Olive Tint", hex: "#7E8569" }
    ],
    stock: 12,
    images: [
      "https://images.unsplash.com/photo-1515372039744-b8f02a3ae446?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1502716119720-b23a93e5fe1b?auto=format&fit=crop&w=800&q=80"
    ],
    rating: 4.6,
    reviewCount: 89,
    tags: ["New Arrival"],
    material: "100% French Flax Linen",
    care: "Gentle machine wash with mild detergent. Warm iron while damp."
  },
  {
    id: "tt-dr-03",
    name: "Emerald Silk-Blend Slip Evening Dress",
    category: "Dresses",
    shortDescription: "Fluid silhouette with cowl neckline and delicate adjustable criss-cross back.",
    fullDescription: "Make a striking impression at cocktail evenings and celebrations. Cut on the bias for a liquid drape that skims curves effortlessly, accented with an alluring low cowl back and discreet side split.",
    price: 2999,
    originalPrice: 4499,
    sizes: ["XS", "S", "M", "L"],
    colors: [
      { name: "Emerald Glaze", hex: "#1B4D3E" },
      { name: "Champagne Gold", hex: "#E7D3B3" },
      { name: "Midnight Black", hex: "#1A1A1A" }
    ],
    stock: 7,
    images: [
      "https://images.unsplash.com/photo-1595777457583-95e059d581b8?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1566174053879-31528523f8ae?auto=format&fit=crop&w=800&q=80"
    ],
    rating: 4.9,
    reviewCount: 68,
    tags: ["Sale", "Trending"],
    material: "Silk Satin Blend (60% Mulberry Silk, 40% Viscose)",
    care: "Dry clean recommended or gentle hand wash in lukewarm water."
  },
  {
    id: "tt-dr-04",
    name: "Pleated Belted Shirt Dress",
    category: "Dresses",
    shortDescription: "Sharp collar, belted waistline, and crisp accordion knife pleats.",
    fullDescription: "Bridging boardroom authority and evening dinner refinement, this pleated shirt dress features structured cuffs, matching belt with minimalist brushed gold buckle, and sunburst accordian pleating that moves fluidly.",
    price: 2499,
    originalPrice: 3199,
    sizes: ["S", "M", "L", "XL", "XXL"],
    colors: [
      { name: "Navy Classic", hex: "#1C2833" },
      { name: "Dusty Cedar", hex: "#AD655F" }
    ],
    stock: 15,
    images: [
      "https://images.unsplash.com/photo-1539109136881-3be0616acf4b?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1550614000-4895a10e1bfd?auto=format&fit=crop&w=800&q=80"
    ],
    rating: 4.7,
    reviewCount: 94,
    tags: ["Best Seller"],
    material: "70% Cotton Poplin, 30% Lyocell",
    care: "Machine wash cold. Hang promptly to avoid wrinkles."
  },

  // --- TOPS & BLOUSES ---
  {
    id: "tt-tp-01",
    name: "Classic White Cotton Blouse",
    category: "Tops and Blouses",
    shortDescription: "Pure combed cotton shirt with tailored French cuffs and clean placket.",
    fullDescription: "An essential wardrobe foundation. Tailored from 100-thread-count organic Egyptian long-staple cotton, this timeless blouse guarantees crisp drape, breathable wear throughout twelve-hour days, and effortless tucking into trousers or denim.",
    price: 1299,
    originalPrice: 1699,
    sizes: ["XS", "S", "M", "L", "XL", "XXL"],
    colors: [
      { name: "Crisp White", hex: "#FFFFFF" },
      { name: "Soft Sky", hex: "#D6E4F0" }
    ],
    stock: 25,
    images: [
      "https://images.unsplash.com/photo-1598554747436-c9293d6a588f?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1604176354204-9268737828e4?auto=format&fit=crop&w=800&q=80"
    ],
    rating: 4.9,
    reviewCount: 215,
    tags: ["Best Seller"],
    material: "100% Long-Staple Organic Cotton",
    care: "Machine wash warm with like colors. Medium iron."
  },
  {
    id: "tt-tp-02",
    name: "Ribbed Knit Square-Neck Top",
    category: "Tops and Blouses",
    shortDescription: "Sculpting ribbed modal top with flattering architecture-inspired square neckline.",
    fullDescription: "A modern minimalist essential. Spun from ultra-fine modal rib with added stretch that hugs the form gently without pinching. Features broad supportive straps and double-lined chest panel for maximum opacity.",
    price: 999,
    originalPrice: 1399,
    sizes: ["XS", "S", "M", "L"],
    colors: [
      { name: "Oatmeal Heather", hex: "#DFD7CD" },
      { name: "Espresso Brown", hex: "#3D2B1F" },
      { name: "Pure Black", hex: "#111111" }
    ],
    stock: 30,
    images: [
      "https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=800&q=80"
    ],
    rating: 4.7,
    reviewCount: 142,
    tags: ["Trending", "New Arrival"],
    material: "92% Lenzing Modal, 8% Elastane",
    care: "Machine wash cold in washbag. Dry flat."
  },
  {
    id: "tt-tp-03",
    name: "Puff-Sleeve Broderie Anglaise Top",
    category: "Tops and Blouses",
    shortDescription: "Delicate eyelet embroidery with vintage puff sleeves and scalloped hemline.",
    fullDescription: "Intricate floral cutout embroidery elevates this romantic summer top. Cut with comfortable gathered shoulders, elasticated cuffs, and a sweetheart neck that pairs sublimely with light denim.",
    price: 1499,
    originalPrice: 1999,
    sizes: ["S", "M", "L", "XL"],
    colors: [
      { name: "Butter Cream", hex: "#FFFDD0" },
      { name: "Pastel Sage", hex: "#B2AC88" }
    ],
    stock: 14,
    images: [
      "https://images.unsplash.com/photo-1564257631407-4deb1f99d992?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=800&q=80"
    ],
    rating: 4.5,
    reviewCount: 76,
    tags: ["Sale"],
    material: "100% Breathable Cotton Voile",
    care: "Hand wash or gentle machine wash inside out."
  },
  {
    id: "tt-tp-04",
    name: "Satin Draped Cowl Camisole",
    category: "Tops and Blouses",
    shortDescription: "Lustrous hammered satin with adjustable spaghetti straps.",
    fullDescription: "Understated luxury at its finest. Hammered satin provides a delicate textured sheen that resists static and wrinkles. Layer under tailored blazers or wear solo for a sleek, contemporary night-out look.",
    price: 899,
    originalPrice: 1299,
    sizes: ["XS", "S", "M", "L", "XL"],
    colors: [
      { name: "Champagne Pearl", hex: "#E8D8C8" },
      { name: "Deep Charcoal", hex: "#2E3033" }
    ],
    stock: 22,
    images: [
      "https://images.unsplash.com/photo-1618244972963-dbee1a7edc95?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1516762689617-e1cffcef479d?auto=format&fit=crop&w=800&q=80"
    ],
    rating: 4.6,
    reviewCount: 110,
    tags: ["Best Seller"],
    material: "95% Hammered Satin Polyester, 5% Spandex",
    care: "Hand wash in cool water. Hang dry."
  },

  // --- JEANS ---
  {
    id: "tt-jn-01",
    name: "High-Waisted Straight-Fit Jeans",
    category: "Jeans",
    shortDescription: "Vintage wash rigid 13oz cotton denim with authentic five-pocket detailing.",
    fullDescription: "Inspired by iconic 90s heritage denim silhouettes. Sits snug on the natural waist with a straight-leg cut that elongates the profile. Features custom copper rivets and durable reinforced chain-stitch construction.",
    price: 2199,
    originalPrice: 2799,
    sizes: ["26", "28", "30", "32", "34", "36"],
    colors: [
      { name: "Vintage Indigo", hex: "#2E4057" },
      { name: "Washed Stonewash", hex: "#5D737E" }
    ],
    stock: 20,
    images: [
      "https://images.unsplash.com/photo-1541099649105-f69ad21f3246?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1582552938357-32b906df40cb?auto=format&fit=crop&w=800&q=80"
    ],
    rating: 4.8,
    reviewCount: 310,
    tags: ["Best Seller", "Trending"],
    material: "99% Cotton, 1% Comfort Stretch",
    care: "Wash inside out with cold water. Avoid frequent washing to preserve wash."
  },
  {
    id: "tt-jn-02",
    name: "Wide-Leg Palazzo Denim Trousers",
    category: "Jeans",
    shortDescription: "Dramatically wide-leg jeans with clean tailored front darts and patch pockets.",
    fullDescription: "Turn heads with exaggerated architecture. Soft washed denim provides comfortable drape without stiffness, featuring a flat front waistband and deep back patch pockets for an elongated silhouette.",
    price: 2499,
    originalPrice: 3299,
    sizes: ["28", "30", "32", "34"],
    colors: [
      { name: "Raw Ecru", hex: "#F3ECE1" },
      { name: "Deep Ink Blue", hex: "#192231" }
    ],
    stock: 11,
    images: [
      "https://images.unsplash.com/photo-1576995853123-5a10305d93c0?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1551803091-e20673f15770?auto=format&fit=crop&w=800&q=80"
    ],
    rating: 4.7,
    reviewCount: 88,
    tags: ["New Arrival"],
    material: "100% Sustainable Organic Cotton",
    care: "Machine wash cold on gentle cycle."
  },
  {
    id: "tt-jn-03",
    name: "Slim-Tapered Ankle-Length Jeans",
    category: "Jeans",
    shortDescription: "Everyday versatile stretch denim with clean cropped hems.",
    fullDescription: "Tailored to contour without restricting movement. Spun with Japanese stretch technology that retains its form and memory all day long without knee sagging.",
    price: 1999,
    originalPrice: 2599,
    sizes: ["28", "30", "32", "34", "36"],
    colors: [
      { name: "Midnight Black", hex: "#1C1C1C" },
      { name: "Smoky Charcoal", hex: "#43464B" }
    ],
    stock: 24,
    images: [
      "https://images.unsplash.com/photo-1602293589930-45aad59ba3ab?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1542272604-780c96856592?auto=format&fit=crop&w=800&q=80"
    ],
    rating: 4.6,
    reviewCount: 165,
    tags: ["Sale"],
    material: "98% Cotton, 2% Polyurethane Spandex",
    care: "Cold wash only. Hang dry in shade."
  },
  {
    id: "tt-jn-04",
    name: "Relaxed Dad-Fit Slouchy Jeans",
    category: "Jeans",
    shortDescription: "Laid-back slouchy fit with subtle distressing and vintage whiskering.",
    fullDescription: "The ultimate off-duty pair. Relaxed through the hip and thigh with a slight taper towards the cuff, capturing effortless streetwear energy.",
    price: 2399,
    originalPrice: 2999,
    sizes: ["28", "30", "32", "34", "36"],
    colors: [
      { name: "Faded Light Wash", hex: "#8DA9C4" }
    ],
    stock: 16,
    images: [
      "https://images.unsplash.com/photo-1475178626620-a4d074967452?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1541099649105-f69ad21f3246?auto=format&fit=crop&w=800&q=80"
    ],
    rating: 4.8,
    reviewCount: 92,
    tags: ["Trending"],
    material: "100% Ring-Spun Cotton Denim",
    care: "Machine wash cold inside out."
  },

  // --- SHIRTS ---
  {
    id: "tt-sh-01",
    name: "Oversized Pure Linen Shirt",
    category: "Shirts",
    shortDescription: "Airy relaxed-fit button-down with dropped shoulders and curved hem.",
    fullDescription: "A breezy silhouette tailor-made for warm climates and effortlessly stylish layering. Cut generously with extended sleeve lengths and clean chest pocket detail.",
    price: 1799,
    originalPrice: 2299,
    sizes: ["S", "M", "L", "XL", "XXL"],
    colors: [
      { name: "Flax Beige", hex: "#E1D4C0" },
      { name: "Sage Mist", hex: "#C2CDBE" },
      { name: "Cloud White", hex: "#FAFAFA" }
    ],
    stock: 22,
    images: [
      "https://images.unsplash.com/photo-1596755094514-f87e34085b2c?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?auto=format&fit=crop&w=800&q=80"
    ],
    rating: 4.9,
    reviewCount: 198,
    tags: ["Best Seller", "Trending"],
    material: "100% Pre-Washed European Linen",
    care: "Machine wash cold on gentle. Steam iron or embrace natural texture."
  },
  {
    id: "tt-sh-02",
    name: "Classic Oxford Cotton Button-Down",
    category: "Shirts",
    shortDescription: "Structured basket-weave oxford cloth shirt with button-down collar.",
    fullDescription: "A wardrobe classic built to last decades. Made with sturdy 2-ply pinpoint cotton that becomes softer with every wash while retaining a structured collar stance.",
    price: 1599,
    originalPrice: 2199,
    sizes: ["S", "M", "L", "XL", "XXL"],
    colors: [
      { name: "Sky Oxford Blue", hex: "#9EC1CF" },
      { name: "Bright White", hex: "#FFFFFF" },
      { name: "Blush Pink", hex: "#F3D5D7" }
    ],
    stock: 28,
    images: [
      "https://images.unsplash.com/photo-1603252109303-2751441dd157?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1598033129183-c4f50c736f10?auto=format&fit=crop&w=800&q=80"
    ],
    rating: 4.8,
    reviewCount: 153,
    tags: ["Best Seller"],
    material: "100% Combed Pinpoint Oxford Cotton",
    care: "Warm machine wash. Tumble dry low or air dry."
  },
  {
    id: "tt-sh-03",
    name: "Cuban Collar Resort Print Shirt",
    category: "Shirts",
    shortDescription: "Retro camp collar with soft fluid drape and custom botanical motif.",
    fullDescription: "Infuse your weekend wardrobe with vacation leisure. Features a relaxed retro open collar, straight hem, side vents, and custom hand-drawn botanical print.",
    price: 1399,
    originalPrice: 1899,
    sizes: ["S", "M", "L", "XL"],
    colors: [
      { name: "Forest Tropic", hex: "#2C4A3E" },
      { name: "Sun Sand", hex: "#D4B483" }
    ],
    stock: 18,
    images: [
      "https://images.unsplash.com/photo-1598033129183-c4f50c736f10?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?auto=format&fit=crop&w=800&q=80"
    ],
    rating: 4.6,
    reviewCount: 82,
    tags: ["Sale", "New Arrival"],
    material: "100% Rayon Viscose",
    care: "Gentle cold cycle wash. Low iron."
  },
  {
    id: "tt-sh-04",
    name: "Striped Poplin Boyfriend Shirt",
    category: "Shirts",
    shortDescription: "Crisp multi-stripe poplin shirt with relaxed unisex cut.",
    fullDescription: "Tailored with clean French seams, extended cuffs, and crisp vertical banker stripes that give an instantly polished look over tank tops or paired with trousers.",
    price: 1499,
    originalPrice: 1999,
    sizes: ["XS", "S", "M", "L", "XL"],
    colors: [
      { name: "Classic Navy Stripe", hex: "#2A4B7C" },
      { name: "Clay Stripe", hex: "#BD6B56" }
    ],
    stock: 19,
    images: [
      "https://images.unsplash.com/photo-1551028719-00167b16eac5?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1596755094514-f87e34085b2c?auto=format&fit=crop&w=800&q=80"
    ],
    rating: 4.7,
    reviewCount: 64,
    tags: ["New Arrival"],
    material: "100% Compact Yarn Poplin Cotton",
    care: "Machine wash warm. Hang to dry."
  },

  // --- TROUSERS ---
  {
    id: "tt-tr-01",
    name: "Relaxed-Fit Cargo Trousers",
    category: "Trousers",
    shortDescription: "Utilitarian cotton twill cargos with gusseted utility pockets and drawstring cuffs.",
    fullDescription: "Constructed with heavyweight durable cotton canvas, tailored for a relaxed drape through the seat and knee. Complete with deep 3D envelope pockets and modular cuff ties.",
    price: 2199,
    originalPrice: 2899,
    sizes: ["28", "30", "32", "34", "36"],
    colors: [
      { name: "Military Olive", hex: "#4B5320" },
      { name: "Desert Sand", hex: "#C2B280" },
      { name: "Stealth Black", hex: "#222222" }
    ],
    stock: 17,
    images: [
      "https://images.unsplash.com/photo-1624378439575-d8705ad7ae80?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1473966968600-fa801b869a1a?auto=format&fit=crop&w=800&q=80"
    ],
    rating: 4.7,
    reviewCount: 145,
    tags: ["Trending", "Best Seller"],
    material: "100% Heavy Twill Cotton",
    care: "Machine wash inside out. Tumble dry normal."
  },
  {
    id: "tt-tr-02",
    name: "High-Waisted Pleated Trousers",
    category: "Trousers",
    shortDescription: "Architectural front pleats with tapered silhouette and tailored waistband.",
    fullDescription: "An elegant essential designed to command confidence. Sharp pressed center creases, blind-stitched hem, and discreet elasticated rear waistband insert for seamless day-long comfort.",
    price: 1999,
    originalPrice: 2699,
    sizes: ["XS", "S", "M", "L", "XL"],
    colors: [
      { name: "Warm Taupe", hex: "#B38B6D" },
      { name: "Jet Black", hex: "#1A1A1A" },
      { name: "Soft Ecru", hex: "#EDE6D6" }
    ],
    stock: 21,
    images: [
      "https://images.unsplash.com/photo-1509631179647-0177331693ae?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1594633312681-425c7b97ccd1?auto=format&fit=crop&w=800&q=80"
    ],
    rating: 4.9,
    reviewCount: 189,
    tags: ["Best Seller"],
    material: "74% Poly-Viscose, 22% Wool Touch, 4% Spandex",
    care: "Dry clean or gentle cold machine wash. Cool iron."
  },
  {
    id: "tt-tr-03",
    name: "Wide-Leg Linen Blend Drawstring Pants",
    category: "Trousers",
    shortDescription: "Ultra-breathable linen trousers with relaxed elastic waistband and natural cord.",
    fullDescription: "The gold standard of resort relaxation. Breathable linen combined with soft rayon prevents harsh creases while ensuring continuous airflow during warm tropical days.",
    price: 1699,
    originalPrice: 2299,
    sizes: ["S", "M", "L", "XL", "XXL"],
    colors: [
      { name: "Natural Flax", hex: "#E3DAC9" },
      { name: "Washed Navy", hex: "#293241" }
    ],
    stock: 23,
    images: [
      "https://images.unsplash.com/photo-1517445312882-bc9910d016b7?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1509631179647-0177331693ae?auto=format&fit=crop&w=800&q=80"
    ],
    rating: 4.6,
    reviewCount: 97,
    tags: ["Sale"],
    material: "55% Linen, 45% Cotton",
    care: "Machine wash delicate. Air dry flat."
  },
  {
    id: "tt-tr-04",
    name: "Tailored Straight-Leg Chino Trousers",
    category: "Trousers",
    shortDescription: "Smart-casual mid-rise chinos with clean slash pockets and welt rear pockets.",
    fullDescription: "Versatile enough for client presentations and casual weekend outings. Soft peached cotton finish provides a velvety touch with just enough stretch for effortless mobility.",
    price: 1799,
    originalPrice: 2399,
    sizes: ["30", "32", "34", "36", "38"],
    colors: [
      { name: "Khaki Stone", hex: "#C3B091" },
      { name: "Deep Navy", hex: "#1B263B" }
    ],
    stock: 19,
    images: [
      "https://images.unsplash.com/photo-1473966968600-fa801b869a1a?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1624378439575-d8705ad7ae80?auto=format&fit=crop&w=800&q=80"
    ],
    rating: 4.7,
    reviewCount: 112,
    tags: ["New Arrival"],
    material: "97% Peached Cotton, 3% Elastane",
    care: "Warm machine wash. Iron medium."
  },

  // --- SKIRTS ---
  {
    id: "tt-sk-01",
    name: "Satin Bias-Cut Midi Skirt",
    category: "Skirts",
    shortDescription: "Gently shimmering satin skirt that falls into a fluid, flattering silhouette.",
    fullDescription: "An icon of timeless styling. Bias cut ensures natural elastic flow around the hips and thighs without tightness. Concealed elasticated waist band sits smoothly against skin.",
    price: 1599,
    originalPrice: 2199,
    sizes: ["XS", "S", "M", "L", "XL"],
    colors: [
      { name: "Champagne Glow", hex: "#E7D8C9" },
      { name: "Rust Clay", hex: "#B85D43" },
      { name: "Pitch Black", hex: "#1A1A1A" }
    ],
    stock: 25,
    images: [
      "https://images.unsplash.com/photo-1583496661160-fb5886a0aaaa?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1577900232427-18219b9166a0?auto=format&fit=crop&w=800&q=80"
    ],
    rating: 4.8,
    reviewCount: 176,
    tags: ["Best Seller", "Trending"],
    material: "96% Premium Polyester Satin, 4% Elastane",
    care: "Gentle cold hand wash. Steam on reverse."
  },
  {
    id: "tt-sk-02",
    name: "Pleated Sunray A-Line Midi Skirt",
    category: "Skirts",
    shortDescription: "Permanent sunray accordion pleats with metallic sheen waistband.",
    fullDescription: "Dynamic geometric movement meets daytime elegance. Heat-set pleats retain razor-sharp definition even through repeated wear and travel washings.",
    price: 1899,
    originalPrice: 2499,
    sizes: ["S", "M", "L", "XL"],
    colors: [
      { name: "Soft Emerald", hex: "#2E5339" },
      { name: "Muted Lavender", hex: "#BFA2DB" }
    ],
    stock: 14,
    images: [
      "https://images.unsplash.com/photo-1577900232427-18219b9166a0?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1583496661160-fb5886a0aaaa?auto=format&fit=crop&w=800&q=80"
    ],
    rating: 4.6,
    reviewCount: 84,
    tags: ["New Arrival"],
    material: "100% Georgette Crepe with inner knit lining",
    care: "Hand wash cold. Do not iron pleats directly."
  },
  {
    id: "tt-sk-03",
    name: "Denim Front-Slit Column Maxi Skirt",
    category: "Skirts",
    shortDescription: "Structured 90s vintage wash denim maxi skirt with center walking slit.",
    fullDescription: "A standout catwalk trend converted to an everyday staple. Front center slit provides fluid walking freedom while authentic wash contrasts give character.",
    price: 2199,
    originalPrice: 2899,
    sizes: ["26", "28", "30", "32", "34"],
    colors: [
      { name: "Vintage Mid Blue", hex: "#4A6FA5" },
      { name: "Chalk Ecru", hex: "#F5F0E6" }
    ],
    stock: 12,
    images: [
      "https://images.unsplash.com/photo-1509631179647-0177331693ae?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1583496661160-fb5886a0aaaa?auto=format&fit=crop&w=800&q=80"
    ],
    rating: 4.7,
    reviewCount: 95,
    tags: ["Sale", "Trending"],
    material: "100% Rigid Heavyweight Cotton Denim",
    care: "Machine wash cold inside out."
  },
  {
    id: "tt-sk-04",
    name: "Tiered Cotton Ruffle Bohemian Skirt",
    category: "Skirts",
    shortDescription: "Flooring bohemian tier skirt with micro-gatherings and tassel ties.",
    fullDescription: "Lightweight tiered cotton voile with playful movement. Features an elasticized drawstring waist accented with handcrafted wooden bead tassels.",
    price: 1399,
    originalPrice: 1899,
    sizes: ["S", "M", "L", "XL"],
    colors: [
      { name: "Terracotta Sand", hex: "#D97D54" },
      { name: "Olive Moss", hex: "#556B2F" }
    ],
    stock: 18,
    images: [
      "https://images.unsplash.com/photo-1515372039744-b8f02a3ae446?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1577900232427-18219b9166a0?auto=format&fit=crop&w=800&q=80"
    ],
    rating: 4.5,
    reviewCount: 62,
    tags: ["New Arrival"],
    material: "100% Hand-Loomed Cotton Voile",
    care: "Cold wash gentle. Dry in shade."
  },

  // --- JACKETS ---
  {
    id: "tt-jk-01",
    name: "Classic Trucker Denim Jacket",
    category: "Jackets",
    shortDescription: "Iconic authentic 14oz denim jacket with brass shank buttons and twin flap pockets.",
    fullDescription: "The all-season layering staple. Distressed subtle hand-scraping gives broken-in vintage character, while sturdy reinforced welt pockets store everyday essentials.",
    price: 2799,
    originalPrice: 3699,
    sizes: ["S", "M", "L", "XL", "XXL"],
    colors: [
      { name: "Heritage Washed Blue", hex: "#3B5998" },
      { name: "Faded Stonewash", hex: "#7B9EBF" }
    ],
    stock: 16,
    images: [
      "https://images.unsplash.com/photo-1576995853123-5a10305d93c0?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1551537482-f2075a1d41f2?auto=format&fit=crop&w=800&q=80"
    ],
    rating: 4.9,
    reviewCount: 240,
    tags: ["Best Seller"],
    material: "100% Heavy Combed Cotton",
    care: "Wash cold inside out. Tumble dry delicate or air dry."
  },
  {
    id: "tt-jk-02",
    name: "Oversized Tailored Double-Breasted Blazer",
    category: "Jackets",
    shortDescription: "Architectural structured shoulder blazer with horn buttons and peaked lapels.",
    fullDescription: "A powerhouse tailoring piece. Broad sculpted shoulders and a relaxed drape strike the ideal balance of modern street edge and sartorial precision.",
    price: 3499,
    originalPrice: 4999,
    sizes: ["XS", "S", "M", "L", "XL"],
    colors: [
      { name: "Oatmeal Melange", hex: "#D6C7B2" },
      { name: "Onyx Black", hex: "#111111" },
      { name: "Pinstripe Camel", hex: "#C19A6B" }
    ],
    stock: 10,
    images: [
      "https://images.unsplash.com/photo-1591047139829-d91aecb6caea?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1539109136881-3be0616acf4b?auto=format&fit=crop&w=800&q=80"
    ],
    rating: 4.8,
    reviewCount: 114,
    tags: ["Trending", "New Arrival"],
    material: "Fine Poly-Viscose Wool Blend with Satin Cupro Lining",
    care: "Professional dry clean only."
  },
  {
    id: "tt-jk-03",
    name: "Quilted Lightweight Bomber Jacket",
    category: "Jackets",
    shortDescription: "Diamond quilted lightweight shell jacket with ribbed collar and hem.",
    fullDescription: "Engineered for transitional weather. Water-resistant matte microfiber outer shell insulated with recycled featherlight thermal fill keeps you comfortably warm.",
    price: 2999,
    originalPrice: 3999,
    sizes: ["S", "M", "L", "XL", "XXL"],
    colors: [
      { name: "Hunter Olive", hex: "#354230" },
      { name: "Midnight Navy", hex: "#1E272E" }
    ],
    stock: 14,
    images: [
      "https://images.unsplash.com/photo-1544441893-675973e31985?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1551028719-00167b16eac5?auto=format&fit=crop&w=800&q=80"
    ],
    rating: 4.7,
    reviewCount: 78,
    tags: ["Sale"],
    material: "100% Recycled Water-Repellent Nylon",
    care: "Machine wash cold gentle cycle. Fasten zippers before washing."
  },
  {
    id: "tt-jk-04",
    name: "Belted Trench Coat with Storm Flap",
    category: "Jackets",
    shortDescription: "Water-resistant cotton gabardine trench coat with storm flap and waist belt.",
    fullDescription: "A legendary British-inspired silhouette reimagined for the modern city commuter. Features double-breasted closure, storm shield back flap, and tortoiseshell buckles.",
    price: 3999,
    originalPrice: 5499,
    sizes: ["S", "M", "L", "XL"],
    colors: [
      { name: "Classic Honey Khaki", hex: "#CCA878" },
      { name: "Raven Black", hex: "#1C1C1C" }
    ],
    stock: 8,
    images: [
      "https://images.unsplash.com/photo-1551028719-00167b16eac5?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1591047139829-d91aecb6caea?auto=format&fit=crop&w=800&q=80"
    ],
    rating: 4.9,
    reviewCount: 92,
    tags: ["Best Seller"],
    material: "100% Dense Cotton Gabardine",
    care: "Specialist dry clean only."
  },

  // --- ETHNIC WEAR ---
  {
    id: "tt-et-01",
    name: "Printed Pure Chanderi Kurta Set",
    category: "Ethnic Wear",
    shortDescription: "Hand-block printed Chanderi kurta with straight pants and organza dupatta.",
    fullDescription: "A celebratory masterpiece combining traditional heritage with minimalist cuts. Features delicate zari edging on neckline, straight cotton-silk trousers, and an airy sheer organza dupatta.",
    price: 3299,
    originalPrice: 4299,
    sizes: ["XS", "S", "M", "L", "XL", "XXL"],
    colors: [
      { name: "Dusty Rose Pink", hex: "#DCAE96" },
      { name: "Mint Pistachio", hex: "#93C572" }
    ],
    stock: 15,
    images: [
      "https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?auto=format&fit=crop&w=800&q=80"
    ],
    rating: 4.9,
    reviewCount: 167,
    tags: ["Best Seller", "Trending"],
    material: "Kurta: Chanderi Silk Blend; Pants: Pure Cotton; Dupatta: Organza",
    care: "Dry clean only to maintain zari luster."
  },
  {
    id: "tt-et-02",
    name: "Embroidered Anarkali Festive Gown",
    category: "Ethnic Wear",
    shortDescription: "Floor-length flared silhouette with intricate mirror work and thread embroidery.",
    fullDescription: "Stun at festive soirees in this lavishly flared 32-kali Anarkali gown. Adorned with delicate threadwork and reflective foil mirror accents along the yolk and grand border.",
    price: 3899,
    originalPrice: 4999,
    sizes: ["S", "M", "L", "XL"],
    colors: [
      { name: "Royal Teal", hex: "#005F73" },
      { name: "Maroon Crimson", hex: "#800000" }
    ],
    stock: 9,
    images: [
      "https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=800&q=80"
    ],
    rating: 4.8,
    reviewCount: 88,
    tags: ["Trending"],
    material: "Fine Georgette with Shantoon Inner Lining",
    care: "Dry clean only."
  },
  {
    id: "tt-et-03",
    name: "Casual A-Line Cotton Daily Kurti",
    category: "Ethnic Wear",
    shortDescription: "Everyday comfort printed cotton kurti with mandarin collar and wooden buttons.",
    fullDescription: "Comfort meets everyday Indian chic. Breathable 60-count cambric cotton fabric stays soft and airy throughout hot summer commutes. Pairs effortlessly with palazzos, denims, or leggings.",
    price: 899,
    originalPrice: 1299,
    sizes: ["S", "M", "L", "XL", "XXL"],
    colors: [
      { name: "Indigo Motif", hex: "#264653" },
      { name: "Mustard Gold", hex: "#E9C46A" }
    ],
    stock: 35,
    images: [
      "https://images.unsplash.com/photo-1617627143750-d86bc21e42bb?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=800&q=80"
    ],
    rating: 4.6,
    reviewCount: 230,
    tags: ["Best Seller", "Sale"],
    material: "100% Breathable Cambric Cotton",
    care: "Machine wash cold with like colors. Line dry in shade."
  },
  {
    id: "tt-et-04",
    name: "Woven Banarasi Silk Festive Dupatta Set",
    category: "Ethnic Wear",
    shortDescription: "Solid raw silk straight suit accompanied by grand woven Banarasi jacquard dupatta.",
    fullDescription: "A regal duo that balances simplicity and royal heritage. The understated raw silk kurta forms a canvas for the stunning woven golden zari floral border dupatta.",
    price: 3599,
    originalPrice: 4799,
    sizes: ["S", "M", "L", "XL"],
    colors: [
      { name: "Royal Purple", hex: "#4B0082" },
      { name: "Ruby Wine", hex: "#722F37" }
    ],
    stock: 11,
    images: [
      "https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?auto=format&fit=crop&w=800&q=80"
    ],
    rating: 4.8,
    reviewCount: 74,
    tags: ["New Arrival"],
    material: "Suit: Raw Silk Blend; Dupatta: Banarasi Art Silk Jacquard",
    care: "Dry clean only."
  },

  // --- ACCESSORIES ---
  {
    id: "tt-ac-01",
    name: "Minimalist Leather Crossbody Bag",
    category: "Accessories",
    shortDescription: "Structured full-grain leather everyday bag with custom brushed gold hardware.",
    fullDescription: "Streamlined elegance crafted to carry phone, wallet, cosmetics, and keys without bulk. Features an adjustable shoulder strap, magnetic snap lock, and interior card slots.",
    price: 1899,
    originalPrice: 2499,
    sizes: ["One Size"],
    colors: [
      { name: "Caramel Tan", hex: "#A0522D" },
      { name: "Obsidian Black", hex: "#1C1C1C" },
      { name: "Warm Ivory", hex: "#FDF5E6" }
    ],
    stock: 25,
    images: [
      "https://images.unsplash.com/photo-1548036328-c9fa89d128fa?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1584917865442-de89df76afd3?auto=format&fit=crop&w=800&q=80"
    ],
    rating: 4.9,
    reviewCount: 140,
    tags: ["Best Seller", "Trending"],
    material: "100% Vegetable-Tanned Vegan Leather with Microfiber Suede Lining",
    care: "Wipe clean with a damp microfiber cloth. Store in provided dust bag."
  },
  {
    id: "tt-ac-02",
    name: "Woven Raffia Tote Summer Bag",
    category: "Accessories",
    shortDescription: "Hand-crocheted natural raffia bag with genuine leather double handles.",
    fullDescription: "Evoking coastal Mediterranean getaways, this spacious woven tote accommodates your beach towel, sunglasses, book, and everyday shopping with effortless resort ease.",
    price: 1499,
    originalPrice: 1999,
    sizes: ["One Size"],
    colors: [
      { name: "Natural Straw", hex: "#E4D5B7" }
    ],
    stock: 15,
    images: [
      "https://images.unsplash.com/photo-1590874103328-eac38a683ce7?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1548036328-c9fa89d128fa?auto=format&fit=crop&w=800&q=80"
    ],
    rating: 4.7,
    reviewCount: 88,
    tags: ["Trending"],
    material: "100% Sustainable Natural Raffia Palm Leaf",
    care: "Spot clean gently with dry bristle brush. Keep away from prolonged water."
  },
  {
    id: "tt-ac-03",
    name: "Classic Silk Square Neck Scarf",
    category: "Accessories",
    shortDescription: "Printed silk twill scarf with hand-rolled edges and geometric border.",
    fullDescription: "A versatile styling accessory. Knot around your neck, wear as a retro headscarf, or drape on the handle of your leather handbag for an instant pop of color.",
    price: 799,
    originalPrice: 1199,
    sizes: ["70x70 cm"],
    colors: [
      { name: "Navy & Ochre", hex: "#1C3144" },
      { name: "Blush Garden", hex: "#E5989B" }
    ],
    stock: 30,
    images: [
      "https://images.unsplash.com/photo-1601924994987-69e26d50dc26?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1584917865442-de89df76afd3?auto=format&fit=crop&w=800&q=80"
    ],
    rating: 4.8,
    reviewCount: 96,
    tags: ["Best Seller"],
    material: "100% Silk Twill (14mm weight)",
    care: "Dry clean or delicate hand wash with silk detergent. Cool iron."
  },
  {
    id: "tt-ac-04",
    name: "Tortoiseshell Polarized Sunglasses",
    category: "Accessories",
    shortDescription: "Modern rectangular frame with 100% UV400 polarized UV-filtering lenses.",
    fullDescription: "Timeless face-flattering shape handcrafted from lightweight, bio-acetate. Protects eyes in bright sunlight with scratch-resistant category-3 polarized lenses.",
    price: 1299,
    originalPrice: 1899,
    sizes: ["Standard"],
    colors: [
      { name: "Amber Tortoise", hex: "#7B3F00" },
      { name: "Gloss Jet Black", hex: "#111111" }
    ],
    stock: 20,
    images: [
      "https://images.unsplash.com/photo-1511499767150-a48a237f0083?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1577803645773-f96470509666?auto=format&fit=crop&w=800&q=80"
    ],
    rating: 4.8,
    reviewCount: 115,
    tags: ["New Arrival", "Sale"],
    material: "Bio-Cellulose Acetate, Polycarbonate TAC lenses",
    care: "Clean with microfiber cloth and lens cleaner. Keep in hard protective case."
  }
];

// Category definition metadata with hero imagery and descriptions
const CATEGORIES = [
  {
    name: "Dresses",
    slug: "Dresses",
    image: "https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?auto=format&fit=crop&w=800&q=80",
    description: "Flowing silhouettes, crisp linen sundresses, and evening slip designs.",
    itemCount: 4
  },
  {
    name: "Tops & Blouses",
    slug: "Tops and Blouses",
    image: "https://images.unsplash.com/photo-1598554747436-c9293d6a588f?auto=format&fit=crop&w=800&q=80",
    description: "Tailored cotton shirts, sculpted ribbed knits, and delicate broderie tops.",
    itemCount: 4
  },
  {
    name: "Jeans",
    slug: "Jeans",
    image: "https://images.unsplash.com/photo-1541099649105-f69ad21f3246?auto=format&fit=crop&w=800&q=80",
    description: "Authentic vintage-wash straight jeans, palazzo trousers, and tapered cuts.",
    itemCount: 4
  },
  {
    name: "Shirts",
    slug: "Shirts",
    image: "https://images.unsplash.com/photo-1596755094514-f87e34085b2c?auto=format&fit=crop&w=800&q=80",
    description: "Breezy French linens, classic pinpoint Oxfords, and Cuban camp collars.",
    itemCount: 4
  },
  {
    name: "Trousers",
    slug: "Trousers",
    image: "https://images.unsplash.com/photo-1509631179647-0177331693ae?auto=format&fit=crop&w=800&q=80",
    description: "Sharp architectural pleats, rugged cargos, and comfortable drawstring linens.",
    itemCount: 4
  },
  {
    name: "Skirts",
    slug: "Skirts",
    image: "https://images.unsplash.com/photo-1583496661160-fb5886a0aaaa?auto=format&fit=crop&w=800&q=80",
    description: "Liquid satin slip skirts, sunburst accordian pleats, and vintage denim maxis.",
    itemCount: 4
  },
  {
    name: "Jackets",
    slug: "Jackets",
    image: "https://images.unsplash.com/photo-1576995853123-5a10305d93c0?auto=format&fit=crop&w=800&q=80",
    description: "Sturdy heritage denim truckers, structured blazers, and classic belted trenches.",
    itemCount: 4
  },
  {
    name: "Ethnic Wear",
    slug: "Ethnic Wear",
    image: "https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=800&q=80",
    description: "Chanderi silk kurta sets, mirror-work Anarkalis, and Banarasi woven dupattas.",
    itemCount: 4
  },
  {
    name: "Accessories",
    slug: "Accessories",
    image: "https://images.unsplash.com/photo-1548036328-c9fa89d128fa?auto=format&fit=crop&w=800&q=80",
    description: "Handcrafted vegan leather crossbodies, woven summer raffias, and silk scarves.",
    itemCount: 4
  }
];

// Fallback image url if Unsplash fails to load or user is offline
const FALLBACK_IMAGE = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='500' viewBox='0 0 400 500'%3E%3Crect width='100%25' height='100%25' fill='%23F4EFEA'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' font-family='sans-serif' font-size='16' fill='%23888888'%3ETHREAD %26 TREND%3C/text%3E%3C/svg%3E";

// Make products immutable in production-like runtime to prevent side-effect bugs
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { PRODUCTS, CATEGORIES, FALLBACK_IMAGE };
}
