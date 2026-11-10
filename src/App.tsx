import {
  ArrowDown,
  ArrowRight,
  ArrowUpRight,
  Check,
  ChevronDown,
  ChevronRight,
  CircleHelp,
  FileImage,
  Heart,
  Menu,
  Minus,
  Plus,
  Search,
  ShoppingBag,
  SlidersHorizontal,
  Sparkles,
  Trash2,
  Upload,
  X,
} from "lucide-react";
import {
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import type {
  ChangeEvent,
  FormEvent,
  KeyboardEvent as ReactKeyboardEvent,
  MouseEvent as ReactMouseEvent,
  PointerEvent as ReactPointerEvent,
} from "react";
import {
  Link,
  NavLink,
  Route,
  Routes,
  useLocation,
  useNavigate,
  useParams,
  useSearchParams,
} from "react-router-dom";
import { categories, formatPrice, products } from "./data";
import type { Product } from "./data";
import { loadArtwork, saveArtwork } from "./artworkStorage";
import { removeSampledBackground } from "./backgroundRemoval";

type CartLine = {
  key: string;
  productId: string;
  slug: string;
  name: string;
  image: string;
  price: number;
  color: string;
  colorHex: string;
  size: string;
  quantity: number;
  placement?: string;
  artworkName?: string;
  artworkId?: string;
  artworkX?: number;
  artworkY?: number;
  artworkScale?: number;
  artworkRotation?: number;
};

const CART_KEY = "bizzx-cart-v1";
const placements = ["Front center", "Left chest"];

function readCart(): CartLine[] {
  try {
    const stored = window.localStorage.getItem(CART_KEY);
    if (!stored) return [];
    const parsed: unknown = JSON.parse(stored);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (line): line is CartLine =>
        typeof line === "object" &&
        line !== null &&
        typeof line.key === "string" &&
        typeof line.productId === "string" &&
        typeof line.quantity === "number",
    );
  } catch {
    return [];
  }
}

function App() {
  const [cart, setCart] = useState<CartLine[]>(readCart);
  const [cartNotice, setCartNotice] = useState("");
  const location = useLocation();

  useEffect(() => {
    const path = location.pathname;
    const productSlug = path.startsWith("/product/") ? path.split("/")[2] : "";
    const product = products.find((item) => item.slug === productSlug);
    const title = product
      ? `${product.name} — BizzX`
      : path === "/shop"
        ? "Shop apparel — BizzX"
        : path === "/create"
          ? "Customize apparel — BizzX"
          : path === "/cart"
            ? "Your bag — BizzX"
            : path === "/"
              ? "BizzX — Make your idea. Make your drop."
              : "Page not found — BizzX";
    document.title = title;
    document
      .querySelector('meta[name="description"]')
      ?.setAttribute(
        "content",
        product
          ? `${product.description} Shop ${product.name} at BizzX.`
          : path === "/shop"
            ? "Explore the BizzX apparel collection. Search and filter sample tees, hoodies, and sweatshirts."
            : path === "/create"
              ? "Build a digital mockup for your custom apparel idea with the BizzX design studio."
              : path === "/cart"
                ? "Review your selected apparel and customization details in your BizzX bag."
                : "Custom apparel for ideas worth wearing. Explore BizzX tees, hoodies and more, or create a design of your own.",
      );
  }, [location.pathname]);

  useEffect(() => {
    try {
      window.localStorage.setItem(CART_KEY, JSON.stringify(cart));
    } catch {
      setCartNotice("Your cart could not be saved in this browser.");
    }
  }, [cart]);

  const addToCart = (line: Omit<CartLine, "key">) => {
    const artworkRef = line.artworkName ? crypto.randomUUID() : "";
    const key = `${line.productId}-${line.color}-${line.size}-${line.placement ?? ""}-${artworkRef}`;
    setCart((current) => {
      const existing = current.find((item) => item.key === key);
      if (existing) {
        return current.map((item) =>
          item.key === key
            ? { ...item, quantity: item.quantity + line.quantity }
            : item,
        );
      }
      return [...current, { ...line, key }];
    });
    setCartNotice(`${line.name} added to your bag.`);
    window.setTimeout(() => setCartNotice(""), 3200);
  };

  const updateQuantity = (key: string, quantity: number) => {
    setCart((current) =>
      quantity < 1
        ? current.filter((item) => item.key !== key)
        : current.map((item) =>
            item.key === key ? { ...item, quantity } : item,
          ),
    );
  };

  const removeFromCart = (key: string) =>
    setCart((current) => current.filter((item) => item.key !== key));

  const itemCount = cart.reduce((total, item) => total + item.quantity, 0);

  return (
    <>
      <Announcement />
      <SiteHeader itemCount={itemCount} />
      <div className="sr-only" aria-live="polite" role="status">
        {cartNotice}
      </div>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/shop" element={<ShopPage />} />
        <Route
          path="/product/:slug"
          element={<ProductPage addToCart={addToCart} />}
        />
        <Route path="/create" element={<CreatePage addToCart={addToCart} />} />
        <Route
          path="/cart"
          element={
            <CartPage
              cart={cart}
              updateQuantity={updateQuantity}
              removeFromCart={removeFromCart}
            />
          }
        />
        <Route path="*" element={<NotFound />} />
      </Routes>
      <SiteFooter />
    </>
  );
}

function Announcement() {
  return (
    <div className="announcement">
      <span className="announcement-dot" aria-hidden="true" />
      YOUR IDEAS DESERVE BETTER MERCH — START CREATING TODAY
      <Link to="/create" aria-label="Start creating a custom design">
        <ArrowRight size={13} aria-hidden="true" />
      </Link>
    </div>
  );
}

function SiteHeader({ itemCount }: { itemCount: number }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [query, setQuery] = useState("");
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    setMobileOpen(false);
    setSearchOpen(false);
  }, [location.pathname]);

  const submitSearch = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    navigate(`/shop${query.trim() ? `?q=${encodeURIComponent(query.trim())}` : ""}`);
    setSearchOpen(false);
  };

  return (
    <header className="site-header">
      <div className="nav-shell">
        <button
          className="icon-button mobile-menu-button"
          type="button"
          aria-label={mobileOpen ? "Close menu" : "Open menu"}
          aria-expanded={mobileOpen}
          onClick={() => setMobileOpen((open) => !open)}
        >
          {mobileOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
        <Link className="wordmark" to="/" aria-label="BizzX home">
          bizz<span>x</span>
          <sup>®</sup>
        </Link>
        <nav className={`main-nav ${mobileOpen ? "is-open" : ""}`}>
          <NavLink to="/shop">Shop</NavLink>
          <NavLink to="/create">Customize</NavLink>
          <a href="/#how-it-works">How it works</a>
          <a href="/#about">About</a>
        </nav>
        <div className="nav-actions">
          <button
            className="icon-button search-trigger"
            type="button"
            aria-label={searchOpen ? "Close search" : "Search products"}
            aria-expanded={searchOpen}
            onClick={() => setSearchOpen((open) => !open)}
          >
            {searchOpen ? <X size={18} /> : <Search size={18} />}
          </button>
          <Link className="nav-cart" to="/cart" aria-label={`Bag, ${itemCount} items`}>
            <ShoppingBag size={18} aria-hidden="true" />
            <span>Bag</span>
            <span className="cart-count">{itemCount}</span>
          </Link>
          <Link className="button button-dark nav-cta" to="/create">
            Start creating <ArrowUpRight size={15} aria-hidden="true" />
          </Link>
        </div>
      </div>
      {searchOpen && (
        <form className="search-panel" onSubmit={submitSearch}>
          <Search size={18} aria-hidden="true" />
          <label className="sr-only" htmlFor="site-search">
            Search apparel
          </label>
          <input
            autoFocus
            id="site-search"
            placeholder="Search tees, hoodies, sweatshirts..."
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
          <button type="submit" className="button button-dark">
            Search
          </button>
        </form>
      )}
    </header>
  );
}

function SectionHeading({
  eyebrow,
  title,
  action,
  actionTo = "/shop",
}: {
  eyebrow: string;
  title: string;
  action?: string;
  actionTo?: string;
}) {
  return (
    <div className="section-heading">
      <div>
        <p className="eyebrow">{eyebrow}</p>
        <h2>{title}</h2>
      </div>
      {action && (
        <Link className="text-link" to={actionTo}>
          {action} <ArrowRight size={16} aria-hidden="true" />
        </Link>
      )}
    </div>
  );
}

function HomePage() {
  return (
    <main>
      <section className="hero">
        <div className="hero-copy">
          <p className="eyebrow light-eyebrow">
            APPAREL FOR THE NEXT BIG THING <span>— EST. FOR YOUR IDEAS</span>
          </p>
          <h1>
            MAKE YOUR
            <br />
            IDEA. MAKE
            <br />
            YOUR <span>DROP.</span>
          </h1>
          <p className="hero-description">
            Premium custom apparel. Made for creators, brands and people with
            something to say.
          </p>
          <div className="hero-actions">
            <Link className="button button-lime" to="/create">
              Start creating <ArrowUpRight size={17} aria-hidden="true" />
            </Link>
            <Link className="button button-outline-light" to="/shop">
              Explore apparel
            </Link>
          </div>
          <div className="hero-footnote">
            <span className="hero-index">01 / 04</span>
            <span className="hero-scroll">
              SCROLL TO EXPLORE <ArrowDown size={13} aria-hidden="true" />
            </span>
          </div>
        </div>
        <div className="hero-visual">
          <img
            src="https://images.unsplash.com/photo-1523398002811-999ca8dec234?auto=format&fit=crop&w=1600&q=90"
            alt="Streetwear apparel photographed in an editorial studio"
            fetchPriority="high"
          />
          <div className="hero-image-label">
            <span>IDEAS IN GOOD COMPANY</span>
            <span>BX—001 / STUDIO</span>
          </div>
          <div className="hero-sticker">
            MADE
            <br />
            YOURS
            <span>↘</span>
          </div>
        </div>
        <div className="hero-side-label">YOUR IDEA. YOUR DROP. YOURS.</div>
      </section>

      <section className="category-section page-gutter">
        <SectionHeading
          eyebrow="01 / THE LINEUP"
          title="START WITH A BLANK."
          action="Shop all apparel"
        />
        <div className="category-grid">
          {categories.map((category, index) => (
            <Link
              className={`category-card category-card-${index + 1}`}
              to={`/shop?category=${encodeURIComponent(category.name)}`}
              key={category.name}
            >
              <img src={category.image} alt="" loading="lazy" />
              <div className="category-overlay" />
              <div className="category-topline">
                <span>0{index + 1} / APPAREL</span>
                <ArrowUpRight size={17} aria-hidden="true" />
              </div>
              <div className="category-info">
                <div>
                  <h3>{category.name}</h3>
                  <p>{category.description}</p>
                </div>
                <span className="category-count">{category.count}</span>
              </div>
            </Link>
          ))}
        </div>
      </section>

      <section className="featured-section page-gutter">
        <SectionHeading
          eyebrow="02 / BIZZX PICKS"
          title="GOOD FORM. GREAT CANVAS."
          action="View the collection"
        />
        <div className="product-grid">
          {products.slice(0, 4).map((product, index) => (
            <ProductCard key={product.id} product={product} index={index} />
          ))}
        </div>
      </section>

      <section className="studio-section" id="about">
        <div className="studio-photo">
          <img
            src="https://images.unsplash.com/photo-1529139574466-a303027c1d8b?auto=format&fit=crop&w=1300&q=85"
            alt="A model wearing modern streetwear"
            loading="lazy"
          />
          <span className="image-caption">BIZZ X YOU / IN THE MAKING</span>
        </div>
        <div className="studio-copy">
          <p className="eyebrow">03 / YOUR CREATIVE SPACE</p>
          <h2>
            YOUR DESIGN.
            <br />
            YOUR <span>RULES.</span>
          </h2>
          <p>
            The best ideas deserve more than a folder on your desktop. Pick a
            piece, bring your artwork, and start seeing what it could become.
          </p>
          <ul className="studio-list">
            <li>
              <span>01</span> Choose your apparel
            </li>
            <li>
              <span>02</span> Add artwork and placement
            </li>
            <li>
              <span>03</span> Preview your idea
            </li>
          </ul>
          <Link className="button button-lime" to="/create">
            Create your first design <ArrowUpRight size={16} aria-hidden="true" />
          </Link>
          <span className="studio-note">
            <CircleHelp size={13} aria-hidden="true" /> Your preview is a
            digital mockup, not a production proof.
          </span>
        </div>
      </section>

      <section className="process-section page-gutter" id="how-it-works">
        <SectionHeading
          eyebrow="04 / THE PROCESS"
          title="FROM BLANK TO YOURS."
        />
        <div className="process-grid">
          {[
            ["01", "Choose your piece", "Find the apparel that fits your idea."],
            ["02", "Add your artwork", "Upload a file and pick a placement."],
            ["03", "See the mockup", "Preview the direction before you go further."],
            ["04", "Make it happen", "Your next step starts with a design you love."],
          ].map(([number, title, description]) => (
            <article className="process-step" key={number}>
              <span className="step-number">{number}</span>
              <div className="step-rule" />
              <h3>{title}</h3>
              <p>{description}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="values-strip">
        <div className="values-mark">
          <Sparkles size={23} aria-hidden="true" />
          <span>THE BIZZ X DIFFERENCE</span>
        </div>
        <p>
          A simple place to explore apparel, test a creative direction, and
          bring your next idea into focus.
        </p>
        <Link to="/create" aria-label="Start a custom design">
          <ArrowRight size={20} />
        </Link>
      </section>

      <section className="closing-cta">
        <p className="eyebrow">GOT SOMETHING TO SAY?</p>
        <h2>
          LET&apos;S MAKE
          <br />
          <span>SOMETHING.</span>
        </h2>
        <Link className="button button-lime" to="/create">
          Let&apos;s create <ArrowUpRight size={16} aria-hidden="true" />
        </Link>
        <span className="closing-stamp">BX—READY</span>
      </section>
    </main>
  );
}

function ProductCard({
  product,
  index,
}: {
  product: Product;
  index: number;
}) {
  return (
    <article className="product-card">
      <Link className="product-image" to={`/product/${product.slug}`}>
        <img src={product.image} alt={product.name} loading="lazy" />
        {product.tag && <span className="product-tag">{product.tag}</span>}
        <span className="product-index">BX—0{index + 1}</span>
        <span className="product-view">
          View piece <ArrowUpRight size={15} aria-hidden="true" />
        </span>
      </Link>
      <div className="product-meta">
        <div>
          <p className="product-category">{product.category}</p>
          <Link to={`/product/${product.slug}`} className="product-name">
            {product.name}
          </Link>
        </div>
        <span className="product-price">From {formatPrice(product.price)}</span>
      </div>
      <div className="swatch-list" aria-label={`Colors for ${product.name}`}>
        {product.colors.slice(0, 4).map((color) => (
          <span
            className="swatch"
            key={color.name}
            style={{ backgroundColor: color.hex }}
            title={color.name}
          />
        ))}
        <span className="swatch-count">{product.colors.length} colors</span>
      </div>
    </article>
  );
}

function ShopPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialQuery = searchParams.get("q") ?? "";
  const initialCategory = searchParams.get("category") ?? "All apparel";
  const [query, setQuery] = useState(initialQuery);
  const [category, setCategory] = useState(initialCategory);
  const [maxPrice, setMaxPrice] = useState(100);
  const [sort, setSort] = useState("featured");
  const [filtersOpen, setFiltersOpen] = useState(false);

  useEffect(() => {
    setQuery(searchParams.get("q") ?? "");
    setCategory(searchParams.get("category") ?? "All apparel");
  }, [searchParams]);

  const filteredProducts = useMemo(() => {
    const result = products.filter((product) => {
      const matchesCategory =
        category === "All apparel" || product.category === category;
      const matchesQuery =
        !query ||
        `${product.name} ${product.category}`
          .toLowerCase()
          .includes(query.toLowerCase());
      return matchesCategory && matchesQuery && product.price <= maxPrice;
    });
    if (sort === "price-low") result.sort((a, b) => a.price - b.price);
    if (sort === "price-high") result.sort((a, b) => b.price - a.price);
    if (sort === "name") result.sort((a, b) => a.name.localeCompare(b.name));
    return result;
  }, [category, maxPrice, query, sort]);

  const updateQuery = (value: string) => {
    setQuery(value);
    if (!value) {
      const next = new URLSearchParams(searchParams);
      next.delete("q");
      setSearchParams(next, { replace: true });
    }
  };

  return (
    <main className="shop-page page-gutter">
      <div className="shop-intro">
        <p className="eyebrow">THE BIZZ X COLLECTION / SAMPLE</p>
        <h1>THE LINEUP.</h1>
        <p>Everyday apparel. Blank canvases. Your next favorite piece.</p>
      </div>
      <div className="shop-toolbar">
        <form
          className="shop-search"
          onSubmit={(event) => {
            event.preventDefault();
            const next = new URLSearchParams(searchParams);
            query ? next.set("q", query) : next.delete("q");
            setSearchParams(next);
          }}
        >
          <Search size={17} aria-hidden="true" />
          <label className="sr-only" htmlFor="shop-search">
            Search apparel
          </label>
          <input
            id="shop-search"
            value={query}
            onChange={(event) => updateQuery(event.target.value)}
            placeholder="Search apparel"
          />
        </form>
        <button
          className={`filter-toggle ${filtersOpen ? "active" : ""}`}
          type="button"
          aria-expanded={filtersOpen}
          onClick={() => setFiltersOpen((open) => !open)}
        >
          <SlidersHorizontal size={16} aria-hidden="true" />
          Filters
          <ChevronDown size={14} aria-hidden="true" />
        </button>
        <label className="sort-control">
          <span>Sort by</span>
          <select value={sort} onChange={(event) => setSort(event.target.value)}>
            <option value="featured">Featured</option>
            <option value="price-low">Price: low to high</option>
            <option value="price-high">Price: high to low</option>
            <option value="name">Name</option>
          </select>
        </label>
      </div>
      <div className={`shop-filters ${filtersOpen ? "filters-open" : ""}`}>
        <div className="filter-field">
          <span className="filter-label">Category</span>
          <div className="filter-chips">
            {["All apparel", ...categories.map((item) => item.name)].map(
              (item) => (
                <button
                  type="button"
                  className={category === item ? "selected" : ""}
                  aria-pressed={category === item}
                  key={item}
                  onClick={() => {
                    setCategory(item);
                    const next = new URLSearchParams(searchParams);
                    item === "All apparel"
                      ? next.delete("category")
                      : next.set("category", item);
                    setSearchParams(next);
                  }}
                >
                  {item}
                </button>
              ),
            )}
          </div>
        </div>
        <label className="filter-price">
          <span className="filter-label">
            Maximum price <strong>{formatPrice(maxPrice)}</strong>
          </span>
          <input
            type="range"
            min="25"
            max="100"
            step="1"
            value={maxPrice}
            onChange={(event) => setMaxPrice(Number(event.target.value))}
          />
          <span className="price-range">
            <span>$25</span>
            <span>$100+</span>
          </span>
        </label>
      </div>
      <div className="result-count">
        <span>{filteredProducts.length} PIECES</span>
        <span className="sample-note">SAMPLE CATALOG / INDICATIVE PRICES</span>
      </div>
      {filteredProducts.length > 0 ? (
        <div className="product-grid shop-product-grid">
          {filteredProducts.map((product, index) => (
            <ProductCard key={product.id} product={product} index={index} />
          ))}
        </div>
      ) : (
        <div className="empty-results">
          <Search size={27} aria-hidden="true" />
          <h2>No pieces found.</h2>
          <p>Try a different search or open up your filters.</p>
          <button
            className="button button-dark"
            type="button"
            onClick={() => {
              setQuery("");
              setCategory("All apparel");
              setMaxPrice(100);
              setSearchParams({});
            }}
          >
            Clear filters
          </button>
        </div>
      )}
      <div className="catalog-disclaimer">
        <CircleHelp size={15} aria-hidden="true" />
        Sample catalog and indicative prices only. Confirm final products and
        pricing with BizzX before launch.
      </div>
    </main>
  );
}

function ProductPage({ addToCart }: { addToCart: (line: Omit<CartLine, "key">) => void }) {
  const { slug } = useParams();
  const product = products.find((item) => item.slug === slug);
  const navigate = useNavigate();
  const [colorIndex, setColorIndex] = useState(0);
  const [size, setSize] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [error, setError] = useState("");

  useEffect(() => {
    setColorIndex(0);
    setSize("");
    setQuantity(1);
    setError("");
  }, [slug]);

  if (!product) return <NotFound />;
  const selectedColor = product.colors[colorIndex] ?? product.colors[0];

  const addItem = () => {
    if (!size) {
      setError("Choose a size to add this piece to your bag.");
      return;
    }
    setError("");
    addToCart({
      productId: product.id,
      slug: product.slug,
      name: product.name,
      image: product.image,
      price: product.price,
      color: selectedColor.name,
      colorHex: selectedColor.hex,
      size,
      quantity,
    });
    navigate("/cart");
  };

  return (
    <main className="detail-page page-gutter">
      <div className="breadcrumbs">
        <Link to="/shop">Shop</Link>
        <ChevronRight size={13} aria-hidden="true" />
        <span>{product.category}</span>
      </div>
      <div className="detail-layout">
        <div className="detail-gallery">
          <div className="detail-main-image">
            <img src={product.image} alt={product.name} />
            <span
              className="detail-color-wash"
              style={{ backgroundColor: selectedColor.hex }}
              aria-hidden="true"
            />
            {product.tag && <span className="product-tag">{product.tag}</span>}
            <span className="gallery-label">BX—STUDIO / MOCK PRODUCT IMAGE</span>
          </div>
        </div>
        <div className="detail-info">
          <p className="eyebrow">{product.category.toUpperCase()} / BX—ESSENTIAL</p>
          <h1>{product.name}</h1>
          <p className="detail-price">{formatPrice(product.price)}</p>
          <p className="detail-description">{product.description}</p>
          <div className="detail-rule" />
          <div className="option-block">
            <div className="option-heading">
              <span>Color</span>
              <span>{selectedColor.name}</span>
            </div>
            <div className="color-options">
              {product.colors.map((color, index) => (
                <button
                  type="button"
                  className={`color-option ${colorIndex === index ? "selected" : ""}`}
                  style={{ backgroundColor: color.hex }}
                  key={color.name}
                  title={color.name}
                  aria-label={color.name}
                  aria-pressed={colorIndex === index}
                  onClick={() => setColorIndex(index)}
                >
                  {colorIndex === index && <Check size={14} aria-hidden="true" />}
                </button>
              ))}
            </div>
          </div>
          <div className="option-block">
            <div className="option-heading">
              <span>Size</span>
            </div>
            <div className="size-options">
              {product.sizes.map((option) => (
                <button
                  type="button"
                  className={size === option ? "selected" : ""}
                  key={option}
                  aria-pressed={size === option}
                  onClick={() => {
                    setSize(option);
                    setError("");
                  }}
                >
                  {option}
                </button>
              ))}
            </div>
          </div>
          <div className="option-block">
            <Link className="text-link" to={`/create?product=${product.slug}`}>
              Add and position artwork in the design studio <ArrowRight size={15} aria-hidden="true" />
            </Link>
          </div>
          <div className="quantity-row">
            <span>Quantity</span>
            <QuantityControl
              quantity={quantity}
              onChange={(next) => setQuantity(Math.max(1, next))}
            />
          </div>
          {error && <p className="form-error" role="alert">{error}</p>}
          <button className="button button-lime add-button" type="button" onClick={addItem}>
            Add to bag — {formatPrice(product.price * quantity)}
            <ShoppingBag size={17} aria-hidden="true" />
          </button>
          <p className="mockup-disclaimer">
            <CircleHelp size={14} aria-hidden="true" />
            Artwork stays in this browser and is not sent to production. Preview
            is a mockup only.
          </p>
          <div className="detail-accordions">
            <details>
              <summary>About this piece <Plus size={15} aria-hidden="true" /></summary>
              <p>{product.description}</p>
            </details>
            <details>
              <summary>Shipping &amp; returns <Plus size={15} aria-hidden="true" /></summary>
              <p>Shipping and return details will be confirmed by BizzX before launch.</p>
            </details>
          </div>
        </div>
      </div>
      <section className="you-may-like">
        <SectionHeading eyebrow="KEEP EXPLORING" title="MORE TO MAKE YOURS." action="Shop all" />
        <div className="product-grid">
          {products
            .filter((item) => item.id !== product.id)
            .slice(0, 3)
            .map((item, index) => (
              <ProductCard key={item.id} product={item} index={index} />
            ))}
        </div>
      </section>
    </main>
  );
}

function CreatePage({ addToCart }: { addToCart: (line: Omit<CartLine, "key">) => void }) {
  const [searchParams] = useSearchParams();
  const initialProduct =
    products.find((item) => item.slug === searchParams.get("product")) ?? products[0];
  const [product, setProduct] = useState(initialProduct);
  const [colorIndex, setColorIndex] = useState(0);
  const [size, setSize] = useState("");
  const [placement, setPlacement] = useState(placements[0]);
  const [artwork, setArtwork] = useState<{
    id: string;
    sourceId: string;
    name: string;
    url: string;
    source: Blob;
    backgroundRemoved: boolean;
  } | null>(null);
  const [error, setError] = useState("");
  const [scale, setScale] = useState(30);
  const [rotation, setRotation] = useState(0);
  const [position, setPosition] = useState({ x: 50, y: 37 });
  const [backgroundSample, setBackgroundSample] = useState<{
    x: number;
    y: number;
    color: string;
  } | null>(null);
  const [samplingBackground, setSamplingBackground] = useState(false);
  const [backgroundTolerance, setBackgroundTolerance] = useState(32);
  const [processingBackground, setProcessingBackground] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const previewStageRef = useRef<HTMLDivElement>(null);
  const dragOffset = useRef<{ pointerId: number; x: number; y: number } | null>(null);
  const navigate = useNavigate();
  const selectedColor = product.colors[colorIndex] ?? product.colors[0];

  useEffect(() => {
    const matched =
      products.find((item) => item.slug === searchParams.get("product")) ?? products[0];
    setProduct(matched);
    setColorIndex(0);
    setSize("");
    setArtwork(null);
    setPosition({ x: 50, y: 37 });
    setScale(30);
    setRotation(0);
    setBackgroundSample(null);
    setSamplingBackground(false);
  }, [searchParams]);

  useEffect(() => {
    return () => {
      if (artwork) URL.revokeObjectURL(artwork.url);
    };
  }, [artwork]);

  const handleUpload = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!["image/png", "image/jpeg"].includes(file.type)) {
      setError("Choose a PNG or JPG image file.");
      event.target.value = "";
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      setError("Artwork must be 2 MB or smaller for this preview.");
      event.target.value = "";
      return;
    }
    try {
      const id = await saveArtwork(file);
      setError("");
      setArtwork({
        id,
        sourceId: id,
        name: file.name,
        url: URL.createObjectURL(file),
        source: file,
        backgroundRemoved: false,
      });
      setPosition({ x: 50, y: 37 });
      setScale(30);
      setRotation(0);
      setBackgroundSample(null);
    } catch {
      setError("Artwork could not be saved in this browser. Please try another file.");
    }
  };

  const sampleBackground = (event: ReactMouseEvent<HTMLImageElement>) => {
    if (!samplingBackground) return;
    const image = event.currentTarget;
    const bounds = image.getBoundingClientRect();
    const fitScale = Math.min(
      bounds.width / image.naturalWidth,
      bounds.height / image.naturalHeight,
    );
    const imageWidth = image.naturalWidth * fitScale;
    const imageHeight = image.naturalHeight * fitScale;
    const offsetX = (bounds.width - imageWidth) / 2;
    const offsetY = (bounds.height - imageHeight) / 2;
    const x = (event.clientX - bounds.left - offsetX) / imageWidth;
    const y = (event.clientY - bounds.top - offsetY) / imageHeight;

    if (x < 0 || x > 1 || y < 0 || y > 1) return;

    const canvas = document.createElement("canvas");
    canvas.width = 1;
    canvas.height = 1;
    const context = canvas.getContext("2d", { willReadFrequently: true });
    if (!context) {
      setError("Could not read the selected background color.");
      return;
    }

    context.drawImage(
      image,
      x * image.naturalWidth,
      y * image.naturalHeight,
      1,
      1,
      0,
      0,
      1,
      1,
    );
    const [red, green, blue] = context.getImageData(0, 0, 1, 1).data;
    setBackgroundSample({
      x,
      y,
      color: `rgb(${red}, ${green}, ${blue})`,
    });
    setSamplingBackground(false);
    setError("");
  };

  const handleRemoveBackground = async () => {
    if (!artwork || !backgroundSample) return;
    setProcessingBackground(true);
    setError("");

    try {
      const processed = await removeSampledBackground(
        artwork.source,
        backgroundSample.x,
        backgroundSample.y,
        backgroundTolerance,
      );
      const id = await saveArtwork(processed);
      setArtwork((current) => current
        ? {
            ...current,
            id,
            url: URL.createObjectURL(processed),
            backgroundRemoved: true,
          }
        : current);
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "Could not remove the selected background. Please try again.",
      );
    } finally {
      setProcessingBackground(false);
    }
  };

  const restoreOriginalArtwork = () => {
    setArtwork((current) => current
      ? {
          ...current,
          id: current.sourceId,
          url: URL.createObjectURL(current.source),
          backgroundRemoved: false,
        }
      : current);
    setBackgroundSample(null);
  };

  const startArtworkDrag = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (samplingBackground || !previewStageRef.current) return;
    const bounds = previewStageRef.current.getBoundingClientRect();
    dragOffset.current = {
      pointerId: event.pointerId,
      x: event.clientX - bounds.left - (position.x / 100) * bounds.width,
      y: event.clientY - bounds.top - (position.y / 100) * bounds.height,
    };
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const moveArtwork = (event: ReactPointerEvent<HTMLDivElement>) => {
    const drag = dragOffset.current;
    const bounds = previewStageRef.current?.getBoundingClientRect();
    if (!drag || drag.pointerId !== event.pointerId || !bounds) return;
    setPosition({
      x: Math.max(0, Math.min(100, ((event.clientX - bounds.left - drag.x) / bounds.width) * 100)),
      y: Math.max(0, Math.min(100, ((event.clientY - bounds.top - drag.y) / bounds.height) * 100)),
    });
  };

  const finishArtworkDrag = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (dragOffset.current?.pointerId === event.pointerId) dragOffset.current = null;
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
  };

  const nudgeArtwork = (event: ReactKeyboardEvent<HTMLDivElement>) => {
    const amount = event.shiftKey ? 5 : 1;
    const offsets: Record<string, { x: number; y: number }> = {
      ArrowLeft: { x: -amount, y: 0 },
      ArrowRight: { x: amount, y: 0 },
      ArrowUp: { x: 0, y: -amount },
      ArrowDown: { x: 0, y: amount },
    };
    const offset = offsets[event.key];
    if (!offset) return;
    event.preventDefault();
    setPosition((current) => ({
      x: Math.max(0, Math.min(100, current.x + offset.x)),
      y: Math.max(0, Math.min(100, current.y + offset.y)),
    }));
  };

  const addDesign = () => {
    if (!size) {
      setError("Choose a size before adding this design to your bag.");
      return;
    }
    addToCart({
      productId: product.id,
      slug: product.slug,
      name: product.name,
      image: product.image,
      price: product.price,
      color: selectedColor.name,
      colorHex: selectedColor.hex,
      size,
      quantity: 1,
      placement: artwork ? placement : undefined,
      artworkName: artwork?.name,
      artworkId: artwork?.id,
      artworkX: artwork ? position.x : undefined,
      artworkY: artwork ? position.y : undefined,
      artworkScale: artwork ? scale : undefined,
      artworkRotation: artwork ? rotation : undefined,
    });
    navigate("/cart");
  };

  return (
    <main className="create-page">
      <div className="create-heading page-gutter">
        <p className="eyebrow">BIZZ X STUDIO / 01</p>
        <h1>MAKE IT <span>YOURS.</span></h1>
        <p>Choose your piece. Add your artwork. See the idea take shape.</p>
      </div>
      <div className="customizer">
        <div className="customizer-preview">
          <div className="preview-toolbar">
            <span>LIVE MOCKUP <i /></span>
            <span>NOT A PRODUCTION PROOF</span>
          </div>
          <div className="preview-stage" ref={previewStageRef}>
            <img src={product.image} alt={`${product.name} front mockup`} />
            <div
              className="preview-color-wash"
              style={{ backgroundColor: selectedColor.hex }}
            />
            {artwork && (
              <div
                className={`artwork-preview ${samplingBackground ? "sampling-background" : ""}`}
                style={{
                  width: `${scale}%`,
                  left: `${position.x}%`,
                  top: `${position.y}%`,
                  transform: samplingBackground
                    ? "translate(-50%, -50%)"
                    : `translate(-50%, -50%) rotate(${rotation}deg)`,
                }}
                role="button"
                tabIndex={0}
                aria-label="Uploaded sticker. Drag to move it. Use arrow keys for precise placement."
                onPointerDown={startArtworkDrag}
                onPointerMove={moveArtwork}
                onPointerUp={finishArtworkDrag}
                onPointerCancel={finishArtworkDrag}
                onKeyDown={nudgeArtwork}
              >
                <img
                  src={artwork.url}
                  alt="Uploaded artwork preview"
                  draggable={false}
                  onClick={sampleBackground}
                />
              </div>
            )}
            <div className="preview-caption">
              <span>FRONT MOCKUP / DIGITAL ONLY</span>
              <span>BX—{product.id.toUpperCase()}</span>
            </div>
          </div>
          <div className="preview-controls">
            <span className="preview-hint">
              <CircleHelp size={14} aria-hidden="true" /> Front mockup only.
              Final print placement needs review.
            </span>
          </div>
        </div>
        <aside className="customizer-panel">
          <div className="customizer-step">
            <span className="customizer-step-number">01</span>
            <div>
              <h2>Choose your piece</h2>
              <label className="select-wrap">
                <span className="sr-only">Apparel style</span>
                <select
                  value={product.slug}
                  onChange={(event) => {
                    const nextProduct = products.find(
                      (item) => item.slug === event.target.value,
                    );
                    if (nextProduct) {
                      setProduct(nextProduct);
                      setColorIndex(0);
                      setSize("");
                      setArtwork(null);
                      setPosition({ x: 50, y: 37 });
                      setScale(30);
                      setRotation(0);
                      setBackgroundSample(null);
                      setSamplingBackground(false);
                    }
                  }}
                >
                  {products.map((item) => (
                    <option key={item.slug} value={item.slug}>
                      {item.name} — {formatPrice(item.price)}
                    </option>
                  ))}
                </select>
                <ChevronDown size={15} aria-hidden="true" />
              </label>
            </div>
          </div>
          <div className="customizer-step">
            <span className="customizer-step-number">02</span>
            <div className="customizer-options">
              <h2>Pick a color</h2>
              <div className="color-options">
                {product.colors.map((color, index) => (
                  <button
                    type="button"
                    className={`color-option ${colorIndex === index ? "selected" : ""}`}
                    style={{ backgroundColor: color.hex }}
                    key={color.name}
                    title={color.name}
                    aria-label={`Choose ${color.name}`}
                    aria-pressed={colorIndex === index}
                    onClick={() => setColorIndex(index)}
                  >
                    {colorIndex === index && <Check size={14} aria-hidden="true" />}
                  </button>
                ))}
                <span className="selected-color-name">{selectedColor.name}</span>
              </div>
            </div>
          </div>
          <div className="customizer-step">
            <span className="customizer-step-number">03</span>
            <div className="customizer-options">
              <h2>Choose a size</h2>
              <div className="size-options compact-sizes">
                {product.sizes.map((option) => (
                  <button
                    type="button"
                    className={size === option ? "selected" : ""}
                    key={option}
                    aria-pressed={size === option}
                    onClick={() => {
                      setSize(option);
                      setError("");
                    }}
                  >
                    {option}
                  </button>
                ))}
              </div>
            </div>
          </div>
          <div className="customizer-step artwork-step">
            <span className="customizer-step-number">04</span>
            <div className="customizer-options">
              <h2>Add your artwork</h2>
              <p>PNG or JPG · Max 2 MB</p>
              <input
                ref={fileInputRef}
                className="sr-only"
                id="artwork-upload"
                type="file"
                accept="image/png,image/jpeg"
                onChange={handleUpload}
              />
              {artwork ? (
                <div className="uploaded-file">
                  <FileImage size={17} aria-hidden="true" />
                  <span>{artwork.name}</span>
                  <button
                    type="button"
                    onClick={() => {
                      setArtwork(null);
                      if (fileInputRef.current) fileInputRef.current.value = "";
                      setBackgroundSample(null);
                      setSamplingBackground(false);
                    }}
                    aria-label="Remove artwork"
                  >
                    <X size={15} />
                  </button>
                </div>
              ) : (
                <button
                  className="upload-dropzone"
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Upload size={17} aria-hidden="true" />
                  <span>Upload artwork</span>
                  <span>PNG / JPG</span>
                </button>
              )}
            </div>
          </div>
          {artwork && (
            <div className="customizer-extra">
              <label>
                <span>Print placement</span>
                <select
                  value={placement}
                  onChange={(event) => {
                    const nextPlacement = event.target.value;
                    setPlacement(nextPlacement);
                    setPosition(nextPlacement === placements[1]
                      ? { x: 58, y: 31 }
                      : { x: 50, y: 37 });
                  }}
                >
                  {placements.map((item) => (
                    <option key={item}>{item}</option>
                  ))}
                </select>
              </label>
              <label>
                <span>Artwork scale <strong>{scale}%</strong></span>
                <input
                  type="range"
                  min="15"
                  max="60"
                  value={scale}
                  onChange={(event) => setScale(Number(event.target.value))}
                />
              </label>
              <label>
                <span>Horizontal position <strong>{Math.round(position.x)}%</strong></span>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={position.x}
                  onChange={(event) =>
                    setPosition((current) => ({ ...current, x: Number(event.target.value) }))
                  }
                />
              </label>
              <label>
                <span>Vertical position <strong>{Math.round(position.y)}%</strong></span>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={position.y}
                  onChange={(event) =>
                    setPosition((current) => ({ ...current, y: Number(event.target.value) }))
                  }
                />
              </label>
              <label>
                <span>Rotation <strong>{rotation}°</strong></span>
                <input
                  type="range"
                  min="-180"
                  max="180"
                  value={rotation}
                  onChange={(event) => setRotation(Number(event.target.value))}
                />
              </label>
              <div className="background-removal">
                <p>Remove a plain background</p>
                <button
                  className="button button-dark"
                  type="button"
                  onClick={() => {
                    setSamplingBackground(true);
                    setError("");
                  }}
                  aria-pressed={samplingBackground}
                >
                  {samplingBackground ? "Click the background in the preview" : "Pick background color"}
                </button>
                {backgroundSample && (
                  <>
                    <span className="sampled-background-color">
                      <i style={{ backgroundColor: backgroundSample.color }} />
                      Selected background
                    </span>
                    <label>
                      <span>Removal strength <strong>{backgroundTolerance}</strong></span>
                      <input
                        type="range"
                        min="0"
                        max="150"
                        value={backgroundTolerance}
                        onChange={(event) => setBackgroundTolerance(Number(event.target.value))}
                      />
                    </label>
                    <button
                      className="button button-lime"
                      type="button"
                      onClick={handleRemoveBackground}
                      disabled={processingBackground}
                    >
                      {processingBackground ? "Removing background…" : "Remove background"}
                    </button>
                  </>
                )}
                {artwork.backgroundRemoved && (
                  <button
                    className="text-link"
                    type="button"
                    onClick={restoreOriginalArtwork}
                  >
                    Restore original image
                  </button>
                )}
                <p>Best for solid backgrounds. Click the background area in your sticker preview.</p>
              </div>
            </div>
          )}
          <div className="customizer-total">
            <span>ESTIMATED PIECE PRICE</span>
            <strong>{formatPrice(product.price)}</strong>
          </div>
          {error && <p className="form-error" role="alert">{error}</p>}
          <button className="button button-lime add-button" type="button" onClick={addDesign}>
            Add design to bag <ArrowRight size={16} aria-hidden="true" />
          </button>
          <p className="mockup-disclaimer">
            <CircleHelp size={14} aria-hidden="true" />
            Artwork stays in this browser and is not sent to a production
            partner.
          </p>
        </aside>
      </div>
    </main>
  );
}

function QuantityControl({
  quantity,
  onChange,
}: {
  quantity: number;
  onChange: (quantity: number) => void;
}) {
  return (
    <div className="quantity-control">
      <button
        type="button"
        aria-label="Decrease quantity"
        onClick={() => onChange(quantity - 1)}
        disabled={quantity <= 1}
      >
        <Minus size={13} />
      </button>
      <span aria-live="polite">{quantity}</span>
      <button
        type="button"
        aria-label="Increase quantity"
        onClick={() => onChange(quantity + 1)}
      >
        <Plus size={13} />
      </button>
    </div>
  );
}

function CartPage({
  cart,
  updateQuantity,
  removeFromCart,
}: {
  cart: CartLine[];
  updateQuantity: (key: string, quantity: number) => void;
  removeFromCart: (key: string) => void;
}) {
  const [artworkUrls, setArtworkUrls] = useState<Record<string, string>>({});
  const [artworkLoadError, setArtworkLoadError] = useState(false);
  const subtotal = cart.reduce((total, item) => total + item.price * item.quantity, 0);

  useEffect(() => {
    let active = true;
    const urls: string[] = [];

    Promise.all(
      cart.flatMap((item) =>
        item.artworkId
          ? [loadArtwork(item.artworkId).then((blob) => {
              if (!active || !blob) return null;
              const url = URL.createObjectURL(blob);
              urls.push(url);
              return [item.artworkId, url] as const;
            })]
          : [],
      ),
    ).then((entries) => {
      if (active) {
        setArtworkLoadError(false);
        setArtworkUrls(Object.fromEntries(entries.filter(
          (entry): entry is readonly [string, string] => entry !== null,
        )));
      }
    }).catch(() => {
      if (active) {
        setArtworkUrls({});
        setArtworkLoadError(true);
      }
    });

    return () => {
      active = false;
      urls.forEach((url) => URL.revokeObjectURL(url));
    };
  }, [cart]);

  return (
    <main className="cart-page page-gutter">
      <div className="cart-heading">
        <div>
          <p className="eyebrow">YOUR PICKS / READY WHEN YOU ARE</p>
          <h1>YOUR BAG<span> ({cart.reduce((sum, item) => sum + item.quantity, 0)})</span></h1>
        </div>
        <Link className="text-link" to="/shop">
          Keep exploring <ArrowRight size={16} aria-hidden="true" />
        </Link>
      </div>
      {cart.length === 0 ? (
        <div className="empty-cart">
          <ShoppingBag size={32} strokeWidth={1.2} aria-hidden="true" />
          <p className="eyebrow">NOTHING IN THE BAG. YET.</p>
          <h2>Every good drop starts somewhere.</h2>
          <p>Find your piece or make something all your own.</p>
          <div className="empty-cart-actions">
            <Link className="button button-dark" to="/shop">Explore apparel</Link>
            <Link className="button button-lime" to="/create">Start creating</Link>
          </div>
        </div>
      ) : (
        <div className="cart-layout">
          <div className="cart-items">
            <div className="cart-table-header">
              <span>PIECE</span>
              <span>QUANTITY</span>
              <span>SUBTOTAL</span>
            </div>
            {cart.map((item) => (
              <article className="cart-item" key={item.key}>
                <Link
                  to={`/product/${item.slug}`}
                  className="cart-item-image"
                  aria-label={`${item.name} in ${item.color}${item.artworkName ? ` with ${item.artworkName}` : ""}`}
                >
                  <img src={item.image} alt={item.name} loading="lazy" />
                  <span
                    className="cart-item-color-wash"
                    style={{ backgroundColor: item.colorHex }}
                    aria-hidden="true"
                  />
                  {item.artworkId && artworkUrls[item.artworkId] && (
                    <img
                      className="cart-item-artwork"
                      src={artworkUrls[item.artworkId]}
                      alt=""
                      style={{
                        width: `${item.artworkScale ?? 30}%`,
                        left: `${item.artworkX ?? (item.placement === placements[1] ? 58 : 50)}%`,
                        top: `${item.artworkY ?? (item.placement === placements[1] ? 31 : 37)}%`,
                        transform: `translate(-50%, -50%) rotate(${item.artworkRotation ?? 0}deg)`,
                      }}
                    />
                  )}
                </Link>
                <div className="cart-item-details">
                  <p className="product-category">{item.name}</p>
                  <span>
                    <i className="cart-color-dot" style={{ backgroundColor: item.colorHex }} />
                    {item.color} / Size {item.size}
                  </span>
                  {item.artworkName && (
                    <span className="cart-artwork">
                      <FileImage size={13} aria-hidden="true" />
                      {item.artworkName}
                      {item.placement ? ` · ${item.placement}` : ""}
                    </span>
                  )}
                  <span className="cart-unit-price">{formatPrice(item.price)} each</span>
                  <button
                    type="button"
                    className="remove-item"
                    onClick={() => removeFromCart(item.key)}
                  >
                    <Trash2 size={13} aria-hidden="true" /> Remove
                  </button>
                </div>
                <QuantityControl
                  quantity={item.quantity}
                  onChange={(quantity) => updateQuantity(item.key, quantity)}
                />
                <strong className="cart-line-price">
                  {formatPrice(item.price * item.quantity)}
                </strong>
              </article>
            ))}
            <div className={`cart-artwork-notice ${artworkLoadError ? "form-error" : ""}`}>
              <CircleHelp size={15} aria-hidden="true" />
              {artworkLoadError
                ? "A saved artwork preview could not be loaded. The file may have been cleared from this browser."
                : "Artwork previews and color selections are saved in this browser only. They are mockups and are not sent to production."}
            </div>
          </div>
          <aside className="order-summary">
            <p className="eyebrow">THE NUMBERS</p>
            <h2>Order summary</h2>
            <div className="summary-row">
              <span>Subtotal</span><strong>{formatPrice(subtotal)}</strong>
            </div>
            <div className="summary-row">
              <span>Shipping</span><span>Calculated later</span>
            </div>
            <div className="summary-row">
              <span>Taxes</span><span>Calculated later</span>
            </div>
            <div className="summary-total">
              <span>Estimated total</span><strong>{formatPrice(subtotal)}</strong>
            </div>
            <button type="button" className="button button-dark checkout-button" disabled>
              Checkout unavailable in demo <ArrowRight size={15} aria-hidden="true" />
            </button>
            <p className="checkout-note">
              This demo has no payment or order service. Prices shown are sample
              values and no order will be placed.
            </p>
            <div className="summary-promise">
              <Heart size={15} aria-hidden="true" />
              Made for your next idea.
            </div>
          </aside>
        </div>
      )}
    </main>
  );
}

function NotFound() {
  return (
    <main className="not-found page-gutter">
      <p className="eyebrow">404 / WRONG TURN</p>
      <h1>THIS PAGE<br /><span>IS A BLANK.</span></h1>
      <Link className="button button-lime" to="/shop">
        Back to the lineup <ArrowRight size={16} aria-hidden="true" />
      </Link>
    </main>
  );
}

function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="footer-main">
        <div className="footer-brand">
          <Link className="wordmark wordmark-footer" to="/" aria-label="BizzX home">
            bizz<span>x</span><sup>®</sup>
          </Link>
          <p>Your idea. Your drop. Your production.</p>
          <span className="footer-note">BUILT FOR WHAT&apos;S NEXT.</span>
        </div>
        <div className="footer-column">
          <p>EXPLORE</p>
          <Link to="/shop">Shop apparel</Link>
          <Link to="/create">Customize</Link>
          <a href="/#how-it-works">How it works</a>
        </div>
        <div className="footer-column">
          <p>THE DETAILS</p>
          <span>Contact details — coming soon</span>
          <span>Shipping details — coming soon</span>
          <span>Returns — coming soon</span>
          <span>Privacy &amp; terms — coming soon</span>
        </div>
        <div className="footer-newsletter">
          <p>THE NEXT DROP</p>
          <span>Explore the studio and start shaping an idea.</span>
          <Link to="/create">
            Start a project <ArrowUpRight size={14} aria-hidden="true" />
          </Link>
        </div>
      </div>
      <div className="footer-bottom">
        <span>© {new Date().getFullYear()} BIZZ X / SAMPLE STOREFRONT</span>
        <span>CATALOG, IMAGERY AND PRICING ARE DEMO CONTENT.</span>
        <Link to="/create">START A PROJECT</Link>
      </div>
      <div className="footer-big-type" aria-hidden="true">BIZZ X</div>
    </footer>
  );
}

export default App;
