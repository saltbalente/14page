/**
 * PAQUETE DE OPTIMIZACIÓN DE RENDIMIENTO PARA BLOGGER
 * Mejora el rendimiento en dispositivos de diferentes gamas
 * Optimiza animaciones, scroll y comportamiento general de la web
 */

(function() {
  // Verificamos si el script ya se ejecutó para evitar duplicación
  if (window.perfOptimizationLoaded) return;
  window.perfOptimizationLoaded = true;
  
  console.log('Iniciando optimización de rendimiento...');
  
  // ===== 1. DETECCIÓN DE CAPACIDADES DEL DISPOSITIVO =====
  function detectDeviceCapabilities() {
    // Intentamos recuperar nivel previo guardado en sesión
    var savedPerfLevel = '';
    try {
      savedPerfLevel = sessionStorage.getItem('devicePerformance');
    } catch(e) {}
    
    // Si ya tenemos un nivel guardado, lo aplicamos directamente
    if (savedPerfLevel) {
      document.body.classList.add('perf-' + savedPerfLevel);
      console.log('Rendimiento recuperado de sesión: ' + savedPerfLevel);
      return;
    }
    
    // Detectar navegador Safari/iOS
    var isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
    var isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
    
    if (isSafari || isIOS) {
      document.documentElement.classList.add('safari');
      document.body.classList.add('safari');
    }
    
    // Inicio con nivel "alto" por defecto
    var perfLevel = 'high';
    
    // 1. Verificamos si es móvil
    var isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    
    // 2. Verificamos memoria (si está disponible)
    var lowMemory = false;
    if (navigator.deviceMemory) {
      lowMemory = navigator.deviceMemory < 4; // Menos de 4GB = baja memoria
    }
    
    // 3. Verificamos CPU (si está disponible)
    var lowCPU = false;
    if (navigator.hardwareConcurrency) {
      lowCPU = navigator.hardwareConcurrency <= 4; // 4 o menos núcleos = CPU baja
    }
    
    // 4. Determinación inmediata basada en hardware (sin esperar test FPS para evitar CLS)
    if ((isMobile && lowMemory && lowCPU) || isIOS) {
      perfLevel = 'low';
    } else if (isMobile && (lowMemory || lowCPU)) {
      perfLevel = 'medium';
    }

    // Aplicar clase inmediatamente
    document.body.classList.add('perf-' + perfLevel);
    console.log('Rendimiento estimado (hardware): ' + perfLevel);
    
    // Ejecutamos optimizaciones
    applyPerformanceOptimizations(perfLevel);

    // 5. Verificación opcional de FPS en segundo plano (sin bloquear renderizado)
    var startTime = performance.now();
    var frames = 0;
    var testDuration = 500;
    
    function rafTest() {
      frames++;
      var currentTime = performance.now();
      if (currentTime - startTime < testDuration) {
        window.requestAnimationFrame(rafTest);
      } else {
        var fps = Math.round(frames / ((currentTime - startTime) / 1000));
        console.log('FPS medidos: ' + fps);
        
        // Solo ajustar si la estimación fue muy optimista
        if (fps < 30 && perfLevel !== 'low') {
          document.body.classList.remove('perf-' + perfLevel);
          document.body.classList.add('perf-low');
          applyPerformanceOptimizations('low');
        }
      }
    }
    
    // Ejecutar test en segundo plano
    window.requestAnimationFrame(rafTest);
  }
  
  // ===== 2. APLICACIÓN DE OPTIMIZACIONES SEGÚN NIVEL =====
  function applyPerformanceOptimizations(level) {
    // 2.1 Optimizaciones para todos los niveles
    optimizeScrollEvents();
    preventMemoryLeaks();
    
    // 2.2 Optimizaciones específicas según nivel
    if (level === 'low') {
      limitAnimations();
      disableHeavyEffects();
      optimizeSVGs();
      lazyLoadResources();
      simplifyDOMManipulation();
    } else if (level === 'medium') {
      moderateAnimations();
      optimizeSVGs();
      lazyLoadResources();
    }
    
    // 2.3 Optimizaciones específicas para Safari
    if (document.body.classList.contains('safari')) {
      applySafariOptimizations();
    }
  }
  
  // ===== 3. FUNCIONES DE OPTIMIZACIÓN ESPECÍFICAS =====
  
  // 3.1 Optimización de eventos de scroll
  function optimizeScrollEvents() {
    // Función de throttle para limitar ejecuciones
    function throttle(fn, delay) {
      let lastCall = 0;
      return function(...args) {
        const now = new Date().getTime();
        if (now - lastCall < delay) {
          return;
        }
        lastCall = now;
        return fn(...args);
      };
    }
    
    // Reemplazar manejadores de scroll existentes
    var originalAddEventListener = window.addEventListener;
    window.addEventListener = function(type, listener, options) {
      if (type === 'scroll') {
        const throttledListener = throttle(listener, 100);
        originalAddEventListener.call(this, type, throttledListener, options);
      } else {
        originalAddEventListener.call(this, type, listener, options);
      }
    };
    
    // Usar passive listeners para eventos táctiles
    var supportsPassive = false;
    try {
      var opts = Object.defineProperty({}, 'passive', {
        get: function() { supportsPassive = true; return true; }
      });
      window.addEventListener('testPassive', null, opts);
      window.removeEventListener('testPassive', null, opts);
    } catch (e) {}
    
    if (supportsPassive) {
      document.addEventListener('touchstart', function(){}, { passive: true });
      document.addEventListener('touchmove', function(){}, { passive: true });
    }
    
    // Optimizar scroll con IntersectionObserver si está disponible
    if ('IntersectionObserver' in window) {
      const observerOptions = {
        root: null,
        rootMargin: '100px',
        threshold: 0.1
      };
      
      const handleIntersection = function(entries, observer) {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            // Lazy load de imágenes
            if (entry.target.hasAttribute('data-src')) {
              entry.target.src = entry.target.dataset.src;
              entry.target.removeAttribute('data-src');
            }
            
            // Activar animación scroll
            if (entry.target.classList.contains('animate-on-scroll')) {
              entry.target.classList.add('animated');
            }
            
            observer.unobserve(entry.target);
          }
        });
      };
      
      const observer = new IntersectionObserver(handleIntersection, observerOptions);
      
      // Observar elementos
      document.querySelectorAll('[data-src], .animate-on-scroll').forEach(el => {
        observer.observe(el);
      });
    }
  }
  
  // 3.2 Prevención de fugas de memoria
  function preventMemoryLeaks() {
    // Limpiar eventos al navegar
    window.addEventListener('beforeunload', function() {
      window.onscroll = null;
    });
    
    // Detención de animaciones no visibles
    setInterval(function() {
      var animatedElements = document.querySelectorAll('.animated');
      
      animatedElements.forEach(function(el) {
        // Verificar si está fuera de la vista
        var rect = el.getBoundingClientRect();
        var isVisible = (
          rect.top >= -rect.height &&
          rect.left >= -rect.width &&
          rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) + rect.height &&
          rect.right <= (window.innerWidth || document.documentElement.clientWidth) + rect.width
        );
        
        // Pausar animaciones no visibles
        if (!isVisible && el.style.animationPlayState !== 'paused') {
          el.style.animationPlayState = 'paused';
        } else if (isVisible && el.style.animationPlayState === 'paused') {
          el.style.animationPlayState = 'running';
        }
      });
    }, 2000);
  }
  
  // 3.3 Limitación de animaciones (para dispositivos lentos)
  function limitAnimations() {
    // Reducir complejidad de todas las animaciones
    document.querySelectorAll('.animated').forEach(function(el) {
      el.style.animationDuration = '0.3s';
      el.style.transitionDuration = '0.2s';
      
      // Limitar propiedades animadas
      if (el.style.transition) {
        el.style.transition = el.style.transition
          .split(',')
          .filter(function(prop) {
            return prop.includes('opacity') || prop.includes('transform');
          })
          .join(',');
      }
    });
    
    // Desactivar completamente animaciones decorativas
    document.querySelectorAll('.decorative-animation, .background-animation').forEach(function(el) {
      el.style.animation = 'none';
      el.style.transition = 'none';
      el.style.opacity = '1';
      el.style.transform = 'none';
    });
  }
  
  // 3.4 Moderación de animaciones (para dispositivos de gama media)
  function moderateAnimations() {
    document.querySelectorAll('.animated').forEach(function(el) {
      el.style.animationDuration = '0.7s';
      el.style.transitionDuration = '0.3s';
      // Conservamos solo will-change en elementos realmente animados
      el.style.willChange = 'auto';
    });
    
    // Desactivar solo animaciones muy pesadas
    document.querySelectorAll('.very-heavy-animation').forEach(function(el) {
      el.style.animation = 'none';
      el.style.transition = 'none';
      el.style.opacity = '1';
    });
  }
  
  // 3.5 Desactivación de efectos pesados
  function disableHeavyEffects() {
    // Reemplazar efectos de parallax
    document.querySelectorAll('[class*="parallax"]').forEach(function(el) {
      el.style.backgroundAttachment = 'scroll';
      el.style.transform = 'none';
    });
    
    // Simplificar sombras y efectos de blur
    document.querySelectorAll('[class*="shadow"], [style*="box-shadow"], [style*="text-shadow"]').forEach(function(el) {
      el.style.boxShadow = 'none';
      el.style.textShadow = 'none';
    });
    
    document.querySelectorAll('[style*="filter"]').forEach(function(el) {
      if (el.style.filter.includes('blur') || el.style.filter.includes('drop-shadow')) {
        el.style.filter = 'none';
      }
    });
  }
  
  // 3.6 Optimización de SVGs
  function optimizeSVGs() {
    // Encuentra todos los SVGs
    document.querySelectorAll('svg').forEach(function(svg) {
      // Asegurar viewBox adecuado
      if (!svg.getAttribute('viewBox') && svg.getAttribute('height') && svg.getAttribute('width')) {
        svg.setAttribute('viewBox', `0 0 ${svg.getAttribute('width')} ${svg.getAttribute('height')}`);
      }
      
      // Mejorar escalado
      svg.setAttribute('preserveAspectRatio', 'xMidYMid meet');
      
      // En dispositivos de bajo rendimiento, reemplazar animaciones SMIL con CSS o eliminarlas
      if (document.body.classList.contains('perf-low')) {
        // Eliminar animaciones SMIL
        svg.querySelectorAll('animate, animateTransform, animateMotion').forEach(function(anim) {
          anim.remove();
        });
        
        // Eliminar filtros complejos
        svg.querySelectorAll('filter').forEach(function(filter) {
          if (filter.querySelectorAll('feGaussianBlur, feDisplacementMap').length > 0) {
            // Encontrar elementos que usan este filtro
            var filterId = filter.id;
            svg.querySelectorAll('[filter="url(#' + filterId + ')"]').forEach(function(el) {
              el.removeAttribute('filter');
            });
            // Eliminar el filtro
            filter.remove();
          }
        });
      }
    });
  }
  
  // 3.7 Lazy loading de recursos
  function lazyLoadResources() {
    // Convertir imágenes a lazy load
    document.querySelectorAll('img:not([loading])').forEach(function(img) {
      // No aplicar a logos o imágenes críticas
      if (!img.classList.contains('logo') && !img.classList.contains('critical')) {
        img.setAttribute('loading', 'lazy');
      }
    });
    
    // Retrasar carga de iframe no críticos
    document.querySelectorAll('iframe:not([loading])').forEach(function(iframe) {
      iframe.setAttribute('loading', 'lazy');
    });
    
    // Cargar scripts no críticos con delay
    Array.from(document.querySelectorAll('script[defer]:not([src*="critical"])')).forEach(function(script) {
      script.setAttribute('async', '');
    });
  }
  
  // 3.8 Simplificación de manipulación del DOM
  function simplifyDOMManipulation() {
    // Reducir operaciones costosas de repaint/reflow
    document.body.classList.add('reduce-animations');
    
    // Evitar hover effects complejos en móviles
    if ('ontouchstart' in window) {
      document.documentElement.classList.add('touch-device');
      
      // CSS para esto ya está en los estilos
    }
  }
  
  // 3.9 Optimizaciones específicas para Safari
  function applySafariOptimizations() {
    // Mejorar scroll con -webkit-overflow-scrolling
    document.body.style.webkitOverflowScrolling = 'touch';
    
    // Forzar hardware acceleration en elementos clave
    document.querySelectorAll('.animated, header, nav, .main-content').forEach(function(el) {
      el.style.transform = 'translateZ(0)';
      el.style.webkitTransform = 'translateZ(0)';
    });
    
    // Fix para animaciones SVG en Safari iOS
    document.querySelectorAll('svg').forEach(function(svg) {
      // Eliminar animaciones SMIL que causan problemas
      svg.querySelectorAll('animate[attributeName="d"], animateTransform[type="rotate"]').forEach(function(anim) {
        anim.remove();
      });
      
      // Asegurar que tiene buena visibilidad
      svg.style.overflow = 'visible';
    });
  }
  
  // ===== 4. INICIALIZACIÓN =====
  // Ejecutar cuando el DOM esté listo
  function initOptimizations() {
    console.log('Inicializando optimizaciones de rendimiento...');
    // Detectar capacidades y aplicar optimizaciones
    detectDeviceCapabilities();
  }
  
  // Iniciar optimizaciones cuando el DOM esté listo
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initOptimizations);
  } else {
    setTimeout(initOptimizations, 100);
  }
})();



  const words = [
        'los mejores brujos',
    'brujos de verdad',
    'brujos cerca de mi',
    'brujos y hechiceros',
    'brujos gratis en linea',
    'brujeria negra',
    'hechizos efectivos',
    'tarot brujo',
    'brujos en estados unidos',
    'vudu brujeria',
	    'brujos consulta gratis',
    'bruja',
    'hechiceria',
	 ' hechizo de amor',
'amarres de amor',
'hechizos efectivos',
'conjuro de amor',
'un amarre',
'amarres de amor brujeria',
'amarres efectivos para el amor',
'amarre a una persona',
'amarre amor',
'hechizo de endulzamiento',
'endulzamiento de amor',
'amarre de brujeria',
'espiritismo y santeria',
'espiritismo',
'centro espiritista',
'centro espiritista cerca de mi',
'brujo amarres',
'magia negra para el amor',
'hechizo para que regrese',
'como hacer un amarre de amor',
'un amarre de amor',
'hechizos para recuperar a tu pareja',
'brujo para amarres',
'que tan efectivo es un amarre de amor',
'amarres de amor near me',
'necesito un amarre de amor urgente',
'necesito un amarre de amor',
'los amarres son verdaderos',
'amarre de amor cerca de mi',
'brujeria',
'brujos',
'endulzamiento de pareja',
'brujeria brujeria',
'espiritista near me',
'brujos amarres',
'amarres de amor',
'brujeria para el amor',
'como hacer un amarre',
'poderoso amarre de amor',
'amarres gratis sin pagar nada',
'hechizo para una persona',
'conjuro amor',
'amarres fuertes',
'conjuros efectivos',
'endulzamiento fuerte',
'los brujos',
'la brujeria',
'endulzamiento efectivo',
'hechizo amarre amor',
'espiritualistas',
'brujeria de amor',
'Brujeria',
'Amarres de amor',
'Hechicería',
'Magia blanca',
'Magia negra',
'Encantamientos',
'Sortilegios',
'Conjuros',
'Hechizos',
'Espiritismo',
'Exorcismos',
'Santeria',
'hacer un amarre',
'endulzamientos',
'brujos reales',
'hechizos de amor',
'endulzamiento',
'brujo real',
'el brujo mayor',
'quitar brujeria',
'brujeria real',
'brujeria es real',
'amarre sexual',
'amarres sexuales',
'brujo mayor',
'rituales de canela',
'endulzamientos con miel y canela',
'brujería y santería',
'hacer brujeria',
'como amarrar aun hombre',
'santeria y brujeria',
'brujeria santeria',
'santería y brujería',
'santeria brujo',
'santeria es brujeria',
'amarres de amor caseros',
'salmos contra la brujería',
'los amarres de amor funcionan',
'brujo blanca',
'amarre brujeria',
'rituales de abundancia',
'brujeria cubana',
'amarres brujeria',
'brujeria amarre',
'brujos cubanos',
'endulzamientos con miel y nombre',
'hechizo para que me llame',
'hechizo para separar a dos personas',
'hechizo del zapato',
'brujeria negra',
'ritual para atraer dinero',
'amarre de amor que es',
'amarre con orina',
'amarres caseros',
'amarres de pareja',
'amarre con menstruación',
'hechizo fuerte para que me llame de inmediato',
'salmo 29 contra brujería',
'hechizo para alejar a una persona',
'amarres para el amor',
'endulzamiento con miel',
'brujeria verde',
'amarre de amor con orina',
'un amarre',
'brujos y hechiceros',
'trabajos de brujeria',
'rituales con la santa muerte',
'brujos colombianos',
'hechizos de luna',
'amarres de amor con la orina',
'hechizos harry potter',
'hechizos caseros para que me escriba en 5 minutos',
'rituales de luna llena',
'ritual para alejar a una persona',
'los brujos',
'endulzamiento de amor',
'endulzamientos de amor',
'brujeria de amor',	  
'rituales con canela',
'brujeria haitiana',
'brujería haitiana',
'brujeria magia negra',
'quitar amarres',
'amuletos contra la brujeria',
'limpia de brujeria',
'foto de brujeria',
'amuletos contra brujeria',
'mexico brujeria',
'hechizo para que me llame en 5 minutos',
'hechizo del vaso de agua para que te llame',
'amarres de amor efectivos',
'hechizo de la cebolla',
'los amarres funcionan',
'ritual para separar a dos personas',
'rituales de amor',
'brujeria blanca',
'brujo wicca',
'ritual de amor',
'ritual para el dinero',
'rituales de santeria',
'hechizos para que me llame en 5 minutos',
'brujos mexicanas',
'ser brujo',
'amarres con la santa muerte',
'brujeria mexicana',
'wicca brujo',
'hechizos con cebolla',
'brujeria con la santa muerte',
'hacer un endulzamiento',
'rituales con luna llena',
'santa muerte brujeria',
'amarres con santa muerte',
'amarres de amor gratis',
'amarres amorosos',
'brujos famosos',
'hechizo del zapato para dominar',
'amarre con ropa interior',
'hechizos de proteccion',
'hechizo para dominar a un hombre',
'hechizo para separar una pareja',
'brujos de verdad',
'brujos buenos',
'amarre con foto',
'rituales para el amor',
'ritual para que me llame',
'hechizo para enamorar a un hombre',
'brujeria con velas',
'hechizo para que me hable',
'hechizo para que me escriba',
'hechizo para atraer el amor',
'ritual para atraer el amor',
'hechizo para que me llame de inmediato',
'hechizo para que me llame ya',
'hechizo para que me llame urgente',
'hechizo para el amor',
'hechizo para que me ame',
'hechizo para que me busque',
'hechizo para que me extrañe',
'hechizo para que me desee',
'hechizo para que me piense',
'hechizo para que me necesite',
'hechizo para que me quiera',
  ];
  
  function getRandomWords() {
    const randomWords = [];
    
    for (let i = 0; i < 8; i++) {
      const randomIndex = Math.floor(Math.random() * words.length);
      randomWords.push(words[randomIndex]);
      words.splice(randomIndex, 1);
    }
    
    return randomWords;
  }
  
  document.addEventListener("DOMContentLoaded", () => {
    const container = document.getElementById("wordsContainer");
    const randomWords = getRandomWords();
    
    randomWords.forEach((word) => {
      const boldWord = document.createElement("strong");
      boldWord.innerText = word;
      container.appendChild(boldWord);
      container.appendChild(document.createTextNode(" "));
    });
  });


const whatsappLink = "https://wa.me/+12194186373?text=NECESITO%20AYUDA";
  const whatsappBanner = document.getElementById("whatsapp-container");
  if (whatsappBanner) {
    whatsappBanner.addEventListener("click", function() {
      window.open(whatsappLink, "_blank");
    });
  }

var name = document.getElementById("name");
  var message = document.getElementById("message");
  var sendMessage = document.getElementById("sendMessage");
  if (name && message && sendMessage) {
    sendMessage.addEventListener("click", function(g) {
      g.preventDefault();
      var f = name.value.trim();
      var e = message.value.trim();
      var text = encodeURIComponent("Hola " + f + "! " + e);
      var h = "https://api.whatsapp.com/send?phone=12545956299&text=" + text;
      window.open(h, "_blank");
    });
  }

const galleryVideoMap = {
  "video-01": {
    title: "Altar 1",
    src: "../assets/videos/video-01.mp4"
  },
  "video-02": {
    title: "Altar 2",
    src: "../assets/videos/video-02.mp4"
  },
  "video-03": {
    title: "Altar 3",
    src: "../assets/videos/video-03.mp4"
  },
  "video-04": {
    title: "Altar 4",
    src: "../assets/videos/video-04.mp4"
  },
  "video-05": {
    title: "Altar 5",
    src: "../assets/videos/video-05.mp4"
  }
};

function setupVideoGallery() {
  var modal = document.getElementById("video-modal");
  var player = document.getElementById("video-modal-player");
  var title = document.getElementById("video-modal-title");
  var closeButton = document.getElementById("video-modal-close");
  var fullscreenButton = document.getElementById("video-modal-fullscreen");
  var triggers = document.querySelectorAll("[data-modal-video]");
  var previews = document.querySelectorAll(".video-gallery-preview");

  if (!modal || !player || !title || !closeButton || !fullscreenButton || !triggers.length) {
    return;
  }

  previews.forEach(function(preview) {
    preview.addEventListener("loadedmetadata", function() {
      try {
        preview.currentTime = Math.min(0.1, preview.duration || 0.1);
      } catch (error) {}
    });
    preview.addEventListener("seeked", function() {
      preview.pause();
    });
  });

  function openVideoModal(videoKey) {
    var videoConfig = galleryVideoMap[videoKey];
    if (!videoConfig) return;
    player.pause();
    player.src = videoConfig.src;
    player.load();
    title.textContent = videoConfig.title;
    modal.classList.add("is-open");
    modal.setAttribute("aria-hidden", "false");
    document.body.classList.add("video-modal-open");
    player.play().catch(function() {});
  }

  function closeVideoModal() {
    modal.classList.remove("is-open");
    modal.setAttribute("aria-hidden", "true");
    document.body.classList.remove("video-modal-open");
    player.pause();
    player.removeAttribute("src");
    player.load();
  }

  function requestPlayerFullscreen() {
    if (player.requestFullscreen) {
      player.requestFullscreen();
    } else if (player.webkitEnterFullscreen) {
      player.webkitEnterFullscreen();
    } else if (player.webkitRequestFullscreen) {
      player.webkitRequestFullscreen();
    } else if (modal.requestFullscreen) {
      modal.requestFullscreen();
    }
  }

  triggers.forEach(function(trigger) {
    trigger.addEventListener("click", function() {
      openVideoModal(trigger.getAttribute("data-modal-video"));
    });
  });

  closeButton.addEventListener("click", closeVideoModal);
  fullscreenButton.addEventListener("click", requestPlayerFullscreen);
  modal.addEventListener("click", function(event) {
    if (event.target && event.target.hasAttribute("data-close-video-modal")) {
      closeVideoModal();
    }
  });
  document.addEventListener("keydown", function(event) {
    if (event.key === "Escape" && modal.classList.contains("is-open")) {
      closeVideoModal();
    }
  });
}

var wordsList = ["brujos", "consulta brujeria", "amarres de amor", "brujeria", "chaman", "brujos de catemaco", "consulta con brujos", "santeria", "babalawo", "brujos gratis", "amarres y hechizos", "hechizos de amor", "brujos expertos", "hacer un amarre", "expertos brujos", "brujeria de pareja"];

  function chooseRandomWords() {
    var randomWords = [];
    while (randomWords.length < 4) {
      var randomWord = wordsList[Math.floor(Math.random() * wordsList.length)];
      if (!randomWords.includes(randomWord)) {
        randomWords.push(randomWord);
      }
    }
    return randomWords;
  }

  function showButtons(containerId) {
    var buttonsContainer = document.getElementById(containerId);
    if (!buttonsContainer) return;
    var randomWords = chooseRandomWords();
    for (var i = 0; i < randomWords.length; i++) {
      var button = document.createElement("li");
      button.innerHTML = randomWords[i];
      button.classList.add("word-button");
      buttonsContainer.appendChild(button);
    }
  }

  showButtons("buttons-container-1");
  showButtons("buttons-container-2");
  setupVideoGallery();
