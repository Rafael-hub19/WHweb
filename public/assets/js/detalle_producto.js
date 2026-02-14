
    // =========================
    // Hamburguesa
    // =========================
    const menuToggle = document.getElementById('menuToggle');
    const navLinks = document.getElementById('navLinks');

    menuToggle.addEventListener('click', () => {
      const isOpen = navLinks.classList.toggle('open');
      menuToggle.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
      menuToggle.textContent = isOpen ? '✕' : '☰';
    });

    // Cierra menú al dar click en un link
    navLinks.querySelectorAll('a').forEach(link => {
      link.addEventListener('click', () => {
        if (navLinks.classList.contains('open')) {
          navLinks.classList.remove('open');
          menuToggle.setAttribute('aria-expanded', 'false');
          menuToggle.textContent = '☰';
        }
      });
    });

    // ==== 1) BASE DE DATOS LOCAL (por ahora solo 1 mueble) ====
    const productos = {
      milano: {
        nombre: "Mueble Milano",
        precio: "$8,500",
        rating: "⭐⭐⭐⭐⭐",
        reseñas: 47,
        stockTexto: "✅ En Stock - Fabricación bajo pedido",
        descripcion:
          "Mueble de baño moderno fabricado en MDF de alta densidad con acabado en nogal. Incluye lavabo de cerámica blanca de primera calidad. Diseño minimalista que combina funcionalidad y elegancia, perfecto para baños contemporáneos.",
        // Si no tienes imágenes aún, deja esto vacío: []
        imagenes: [],
        features: [
          { icon: "📏", text: "Dimensiones: 80cm x 45cm x 60cm" },
          { icon: "🪵", text: "Material: MDF de alta densidad" },
          { icon: "🎨", text: "Acabado: Nogal resistente al agua" },
          { icon: "🚰", text: "Lavabo: Cerámica blanca incluido" },
          { icon: "🔧", text: "Instalación: Profesional disponible" },
          { icon: "✅", text: "Garantía: Incluida en el producto" },
        ],
        specs: [
          { label: "Modelo", value: "Milano MM-2024" },
          { label: "Dimensiones Totales", value: "Alto: 60cm | Ancho: 80cm | Fondo: 45cm" },
          { label: "Material Principal", value: "MDF 18mm alta densidad" },
          { label: "Acabado", value: "Nogal mate resistente al agua" },
          { label: "Lavabo", value: "Cerámica blanca vitrificada - 75cm x 40cm" },
          { label: "Sistema de Montaje", value: "Flotante con soportes metálicos reforzados" },
          { label: "Almacenamiento", value: "2 cajones con guías metálicas suaves" },
          { label: "Peso Máximo Soportado", value: "80 kg" },
          { label: "País de Fabricación", value: "México" },
          { label: "Tiempo de Entrega", value: "5-7 días hábiles" },
        ],
      },
    };

    // ==== 2) LEER ID DE LA URL ====
    const params = new URLSearchParams(window.location.search);
    const id = params.get("id") || "milano"; // si no manda id, usa milano
    const p = productos[id];

    // ==== 3) SI NO EXISTE, MOSTRAR MENSAJE ====
    if (!p) {
      document.getElementById("page").innerHTML = `
        <div class="not-found">
          <h2 style="color:#8b7355; margin-bottom:10px;">Producto no encontrado</h2>
          <p style="color:#a0a0a0; margin-bottom:20px;">El producto que intentas ver no existe o fue eliminado.</p>
          <a href="catalogo.html" style="color:#8b7355; text-decoration:none; font-weight:700;">← Volver al catálogo</a>
        </div>
      `;
    } else {
      // ==== 4) RELLENAR CONTENIDO ====
      document.title = `${p.nombre} - Wooden House`;
      document.getElementById("pNombre").textContent = p.nombre;
      document.getElementById("pPrecio").textContent = p.precio;
      document.getElementById("pRating").innerHTML = `${p.rating} <span>(${p.reseñas} reseñas)</span>`;
      document.getElementById("pDesc").textContent = p.descripcion;

      // Stock texto (si quieres mostrar el texto largo)
      const stockEl = document.getElementById("pStock");
      if (stockEl && p.stockTexto) {
        stockEl.innerHTML = `<span style="font-size: 20px;">✅</span><span><strong>En Stock</strong> - ${p.stockTexto.replace("✅ En Stock - ", "")}</span>`;
      }

      // Features
      document.getElementById("pFeatures").innerHTML = p.features.map(f => `
        <div class="feature-item">
          <span class="feature-icon">${f.icon}</span>
          <span>${f.text}</span>
        </div>
      `).join("");

      // Specs
      document.getElementById("specTable").innerHTML = p.specs.map(s => `
        <div class="spec-row">
          <span class="spec-label">${s.label}</span>
          <span class="spec-value">${s.value}</span>
        </div>
      `).join("");

      // Imágenes (si luego agregas rutas, se mostrará)
      const imgs = p.imagenes || [];
      const mainImg = document.getElementById("mainImage");
      const mainText = document.getElementById("mainImageText");
      const thumbs = document.getElementById("thumbs");

      if (imgs.length > 0) {
        mainImg.src = imgs[0];
        mainImg.style.display = "block";
        mainText.style.display = "none";

        thumbs.innerHTML = imgs.slice(0, 4).map((src, i) => `
          <div class="thumbnail" data-src="${src}">
            <img src="${src}" alt="Vista ${i+1}" style="display:block;">
          </div>
        `).join("");

        thumbs.querySelectorAll(".thumbnail").forEach(t => {
          t.addEventListener("click", () => {
            mainImg.src = t.dataset.src;
          });
        });
      } else {
        // sin imágenes aún
        thumbs.innerHTML = `
          <div class="thumbnail">[Vista 1]</div>
          <div class="thumbnail">[Vista 2]</div>
          <div class="thumbnail">[Vista 3]</div>
          <div class="thumbnail">[Vista 4]</div>
        `;
      }
    }

    // ==== 5) Cantidad (UI) ====
    let qty = 1;
    const qtyEl = document.getElementById("qty");
    const btnMinus = document.getElementById("btnMinus");
    const btnPlus = document.getElementById("btnPlus");

    if (btnMinus && btnPlus && qtyEl) {
      btnMinus.addEventListener("click", () => {
        qty = Math.max(1, qty - 1);
        qtyEl.textContent = qty;
      });
      btnPlus.addEventListener("click", () => {
        qty = qty + 1;
        qtyEl.textContent = qty;
      });
    }

    // (demo) Agregar al carrito
    const btnAddCart = document.getElementById("btnAddCart");
    if (btnAddCart) {
      btnAddCart.addEventListener("click", () => {
        alert(`Agregaste ${qty} x ${p ? p.nombre : "producto"} al carrito ✅`);
      });
    }
  