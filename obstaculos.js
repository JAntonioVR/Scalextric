import * as THREE from '../libs/three.module.js'
import * as TWEEN from '../libs/tween.esm.js'


//
// ──────────────────────────────────────────────────────────────
//   :::::: P I N C H O : :  :   :    :     :        :          :
// ──────────────────────────────────────────────────────────────
// Pincho, un cono con material brillante

class Pincho extends THREE.Object3D{
    
    //
    // ─── CONSTRUCTOR ────────────────────────────────────────────────────────────────
    // Crea la geometría y el material, y por tanto el Mesh
  
    constructor(){
        super();
        var conoGeo = new THREE.ConeBufferGeometry(0.5, 5, 20, 20);
        conoGeo.translate(0,2.5,0);
        var material = new THREE.MeshPhongMaterial({
            color: 0xC0C0C0,
            emissive: 0x0,
            specular: 0xFFFFFF,
            shininess: 100
        });

        var pincho = new THREE.Mesh(conoGeo, material);
        this.add(pincho)
    }

}


//
// ────────────────────────────────────────────────────────────────
//   :::::: P I N C H O S : :  :   :    :     :        :          :
// ────────────────────────────────────────────────────────────────
//

class Pinchos extends THREE.Object3D{

    //
    // ─── CONSTRUCTOR ────────────────────────────────────────────────────────────────
    // Gracias a la clase Pincho, consiste solo en añadir algunos pinchos y crear
    // las animaciones de subida y bajada
        
    constructor(){
        super();

        for (let i = -3; i <= 3; i++) {
            var pincho = new Pincho();
            pincho.position.set(i,0,0);
            this.add(pincho);
        }

        this.animate();
        
    }


    //
    // ─── ANIMACIONES ────────────────────────────────────────────────────────────────
    // Crea e inicia la animación de subida y bajada de los pinchos usando TWEEN
        
    animate(){
        var origen  = {t: 0},
            destino = {t: -7};

        var time = 1;

        var that = this;

        var animacion = new TWEEN.Tween(origen)
            .to(destino, time*1000)
            .easing(TWEEN.Easing.Linear.None)
            .repeat(Infinity)
            .yoyo(true)
            .onUpdate(
                function(){
                    that.position.y = origen.t;
                }
            );

        animacion.start();
    }

    //
    // ─── METODO UPDATE ──────────────────────────────────────────────────────────────
    //        
    update () {
        TWEEN.update() ;
    }

}

// ────────────────────────────────────────────────────────────────────────────────

//
// ────────────────────────────────────────────────────────────────
//   :::::: B A R R E R A : :  :   :    :     :        :          :
// ────────────────────────────────────────────────────────────────
//

class Barrera extends THREE.Object3D{
    
    //
    // ─── CONSTRUCTOR ────────────────────────────────────────────────────────────────
    // Construye la geometría, el material de la barrera mediante texturas y las 
    // animaciomes

        
    constructor(){
        super();
        var geo = new THREE.BoxBufferGeometry(2,5,0.5);
        geo.translate(0,2,0);
        var texture = new THREE.TextureLoader().load('./img/wall.jpg');
        var material = new THREE.MeshPhongMaterial ({map: texture});

        this.muro = new THREE.Mesh(geo,material);
        this.add(this.muro);
        this.animate();

    }


    //
    // ─── ANIMATE ────────────────────────────────────────────────────────────────────
    // Animaciones de movimiento de un lado a otro de la barrera
        
    animate(){
        var origen = {x:-2.5},
            destino = {x:2.5};
        var time = 3;
        var that = this;
        var animacion = new TWEEN.Tween(origen)
            .to(destino, time*1000)
            .easing(TWEEN.Easing.Quadratic.InOut)
            .repeat(Infinity)
            .yoyo(true)
            .onUpdate(
                function(){
                    that.muro.position.x = origen.x;
                }
            );
        animacion.start();
    }

    
    //
    // ─── METODO UPDATE ──────────────────────────────────────────────────────────────
    //  

    update () {
        TWEEN.update() ;
    }
}

// ────────────────────────────────────────────────────────────────────────────────

export { Pinchos, Barrera }