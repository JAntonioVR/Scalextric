import * as THREE from '../libs/three.module.js'


import { MTLLoader } from '../libs/MTLLoader.js'
import { OBJLoader } from '../libs/OBJLoader.js'
import * as TWEEN from '../libs/tween.esm.js'

//
// ────────────────────────────────────────────────────────────────────────────── I ──────────
//   :::::: C O C H E   D E S D E   F I C H E R O : :  :   :    :     :        :          :
// ────────────────────────────────────────────────────────────────────────────────────────
//

class CarFromFile extends THREE.Mesh{
    
    //
    // ─── CONSTRUCTOR ────────────────────────────────────────────────────────────────
    // Procesa los archivos mtl y obj para generar el coche e inicializa los atributos
    // que en instancias posteriores serán las luces de los coches
        
    constructor(mtlFile, objFile){
        super();

        var that = this;
        this.modelo = null;
        var materialLoader = new MTLLoader();
        var objectLoader = new OBJLoader();
        materialLoader.load(mtlFile,
            function(materials){
                objectLoader.setMaterials(materials);
                objectLoader.load(objFile,
                    function(object){
                        that.modelo = object;
                        that.add(that.modelo);
                    },
                    null, null);
            }
        );

        // Añadimos la posibilidad de tener luces
        this.luz1 = null;
        this.luz2 = null;
    }


    //
    // ─── CAMBIAR LUCES ──────────────────────────────────────────────────────────────
    // Interruptor, enciende las luces si están apagadas o las apaga si están encendidas
        
    cambiarLuces(){
        if(this.luz1!=null) this.luz1.visible = !this.luz1.visible;
        if(this.luz2!=null) this.luz2.visible = !this.luz2.visible;
    }

    
    //
    // ─── CONFIGURAR LAS SOMBRAS ─────────────────────────────────────────────────────
    // Configura una luz para que pueda arrojar sombras

    configuraSombras(light){
        if(light!=null){
            light.castShadow            = true;
            light.shadow.mapSize.width  = 512;
            light.shadow.mapSize.height = 512;
            light.shadow.camera.near    = 0.5;
            light.shadow.camera.far     = 500;
        }
    }

}


//
// ────────────────────────────────────────────────────────────────────────
//   :::::: P O R S C H E   9 1 1 : :  :   :    :     :        :          :
// ────────────────────────────────────────────────────────────────────────
// El coche 1, hereda de CarFromFile

class Porsche911 extends CarFromFile{
    
    //
    // ─── CONSTRUCTOR ────────────────────────────────────────────────────────────────
    // Crea el coche a partir de los ficheros y se crean las luces
        
    constructor(){
        super('./models/porsche911/911.mtl', 
              './models/porsche911/Porsche_911_GT2.obj');

        // Orientamos el coche (por defecto viene girado)
        this.rotation.y = Math.PI;

        // Creamos, colocamos y añadimos las luces
        var target1 = new THREE.Object3D();
        target1.position.set(-0.7,0.0,-2.75)
        this.add(target1);
        var luz1 = new THREE.SpotLight(0x8fbaad, 0.5);
        luz1.position.set(-0.70,0.0,-1.75);
        luz1.target = target1;
        this.luz1 = luz1;
        this.add(luz1);
        this.configuraSombras(luz1);
        

        var target2 = new THREE.Object3D();
        target2.position.set(0.7,0.0,-2.75)
        this.add(target2);
        var luz2 = new THREE.SpotLight(0x8fbaad, 0.5);
        luz2.position.set(0.7,0.0,-1.75);
        luz2.target = target2;
        this.luz2 = luz2;
        this.add(luz2);
        this.configuraSombras(luz2);

        this.cambiarLuces(); // Para que inicialmente estén apagadas
    }
}

//
// ────────────────────────────────────────────────────────────────
//   :::::: F E R R A R I : :  :   :    :     :        :          :
// ────────────────────────────────────────────────────────────────
// El coche 2, hereda de Car FromFile


class Ferrari extends CarFromFile{
    constructor(){
        super("./models/California/california.mtl", 
              "./models/California/california.obj");

        // Orientamos el coche (por defecto viene girado)
        this.rotation.x = -Math.PI/2;

        // Creamos, colocamos y añadimos las luces
        var target1 = new THREE.Object3D();
        target1.position.set(0.75,-2.5,0);
        this.add(target1);
        var luz1 = new THREE.SpotLight(0x8fbaad, 0.5);
        luz1.position.set(0.75,-1.5,0);
        luz1.target = target1;
        this.luz1 = luz1;
        this.add(luz1);
        this.configuraSombras(luz1);

        var target2 = new THREE.Object3D();
        target2.position.set(-0.75,-2.5,0)
        this.add(target2);
        var luz2 = new THREE.SpotLight(0x8fbaad, 0.5);
        luz2.position.set(-0.75,-1.5,0);
        luz2.target = target2;
        this.luz2 = luz2;
        this.add(luz2);
        this.configuraSombras(luz2);

        this.cambiarLuces(); // Para que inicialmente estén apagadas

    }
}


//
// ────────────────────────────────────────────────────────
//   :::::: C A R : :  :   :    :     :        :          :
// ────────────────────────────────────────────────────────
//

class Car extends THREE.Mesh{

    //
    // ─── CONSTRUCTOR ────────────────────────────────────────────────────────────────
    // Crea, coloca e inicializa los atributos que necesita cada coche para su uso
        
    constructor(staticCar, path, gui, number, titleGui){
        super();
        // Se crea la GUI
        this.createGUI(gui, titleGui);
        
        this.clock             = new THREE.Clock();  // Necesitamos un reloj para gestionar la velocidad de avance del coche independientemente del PC
        this.path              = path;               // La ruta que sigue el coche (que es la misma que la del circuito)
        this.velocidadActual   = 0;                  // Velocidad que llevará en cada momento el coche, inicialmente 0
        this.tActual           = 0;                  // Del 0 al 1, indica en qué posición del spline está el coche, inicialmente en 0
        this.colision          = false;              // Indica si ha habido alguna colisión
        this.animacionColision = false;              // Cuando se activa se activan las animaciones de colisión
        this.ganador           = false;              // Se activa cuando este coche gana la partida
        this.estado            = Car.VELOCIDAD_CTE;  // Estado de la velocidad del coche: acelerando, frenando o constante

        // staticCar es una instancia de Porsche911 (si number==1) o de Ferrari (si number==2)
        // NOTE Necesitamos crear un mesh distinto porque necesitamos desplazar y orientar el coche
        // por el circuito, pero sin afectar a la orientación ya fijada en la clase Porsche911 o
        // Ferrari. Dependiendo de qué coche sea se desplaza a una determinada posición o a otra.
        this.carModel  = staticCar;
        this.staticCar = new THREE.Mesh();
        if(number == 1)
            staticCar.position.set(2.5,0.7,0);
        else
            staticCar.position.set(-2.5,0.8,0);
            
        this.staticCar.add(staticCar);
        this.add(this.staticCar);

        // Orientamos el coche en el circuito (este mesh)
        var tangente = this.path.getTangentAt(this.tActual);
        var posicion = new THREE.Vector3(this.staticCar.position.x,this.staticCar.position.y,this.staticCar.position.z);
        posicion.add(tangente);
        this.target = posicion;         // Punto al que está orientado el coche
        this.staticCar.lookAt(posicion);

    }


    //
    // ─── INTERFAZ GRAFICA ───────────────────────────────────────────────────────────
    // Creación de la interfaz gráfica

    createGUI (gui,titleGui) {

        var that = this;

        this.guiControls = new function () {
            this.velocidad = 0;             // Velocidad del coche
            this.luces     = false;         // Luces encendidas o apagadas
            this.reset     = function(){    // Posibilidad de volver a la parrilla de salida
                that.animacionColision    = false;
                that.velocidadActual      = 0;
                that.tActual              = 0;
                var posicion              = that.path.getPointAt(0);
                that.staticCar.position.copy(posicion);
                var tangente = that.path.getTangentAt(0);
                posicion.add(tangente.multiplyScalar(50));
                that.staticCar.lookAt(posicion);
            }
        } 

        var folder = gui.addFolder (titleGui);

        folder.add (this.guiControls, 'velocidad', 0, 0.1, 0.01).name ('Velocidad :\t').onChange(
            function(){
                if(!this.colision)
                    that.velocidadActual = that.guiControls.velocidad;
            }
        );

        folder.add (this.guiControls, 'luces').name ('Luces encendidas : ').onChange(
            function(){
                that.carModel.cambiarLuces();
            }
        )
        folder.add (this.guiControls, "reset").name("Reset");
    }


    //
    // ─── GET LOCALIZACION ───────────────────────────────────────────────────────────
    // Devuelve el atributo tActual, que representa la posición en la que está el coche    

    getLocation(){
        return this.tActual;
    }
    

    //
    // ─── GET POSICION ───────────────────────────────────────────────────────────────
    // Devuelve la posición en la que se encuentra el coche
        
    getPosition(){
        return this.staticCar.position;
    }


    //
    // ─── GET staticCar ──────────────────────────────────────────────────────────────
    // Devuelve el coche estático
        
    getStaticCar(){
        return this.staticCar;
    }


    //
    // ─── GET TARGET ─────────────────────────────────────────────────────────────────
    // Devuelve el punto hacia el que está orientado el coche
        
    getTarget(){
        return this.target;
    }


    //
    // ─── HA COLISIONADO ─────────────────────────────────────────────────────────────
    // Activa el atributo colision
        
    haColisionado(){
        this.colision = true;
    }


    //
    // ─── HA GANADO ──────────────────────────────────────────────────────────────────
    // Activa el atributo ganador y para el coche
        
    haGanado(){
        this.ganador = true;
        this.velocidadActual = 0;
        this.estado = Car.VELOCIDAD_CTE;
    }


    //
    // ─── MODIFICAR VELOCIDAD ────────────────────────────────────────────────────────
    // Modifica la velocidad, dentro de unos márgenes

    modificaVelocidad(a){
        if(a > 0) this.velocidadActual = Math.min(this.velocidadActual+a, 0.1);
        if(a < 0) this.velocidadActual = Math.max(-0.01, this.velocidadActual+a);
    }

    //
    // ─── ACELERA ────────────────────────────────────────────────────────────────────
    // Avanza la posición y la orientación según la velocidad

    acelera(){
        var segundos = this.clock.getDelta();
        var t = this.tActual + segundos*this.velocidadActual;
        if (t < 0) t = 0;                                   // Para evitar valores negativos de t
        t            = t-Math.trunc(t);                     // Solo quiero los decimales
        this.tActual = t;
        var posicion = this.path.getPointAt(this.tActual);
        this.staticCar.position.copy(posicion);
        var tangente = this.path.getTangentAt(this.tActual);
        posicion.add(tangente.multiplyScalar(50));
        this.staticCar.lookAt(posicion);
        this.target = posicion;
    }


    //
    // ─── CHOCA ──────────────────────────────────────────────────────────────────────
    // Crea y activa las animaciones para cuando hay un choque    

    choca(){
        var origen1  = {y: 0},
            destino1 = {y: 6};

        var time = 0.5; //Segundos que dura la animación

        var that = this;

        var animacion1 = new TWEEN.Tween(origen1)
            .to(destino1, time*1000)
            .easing(TWEEN.Easing.Quadratic.Out)
            .yoyo(true)
            .repeat(1)
            .onUpdate(
                function(){
                    that.position.y = origen1.y;
                }
            );
        animacion1.start();

        var origen2  = {angle: 0 },
            destino2 = {angle: 2.0*Math.PI};

        var time = 1; //Segundos que dura la animación

        var that = this;

        var animacion2 = new TWEEN.Tween(origen2)
            .to(destino2, time*1000)
            .easing(TWEEN.Easing.Linear.None)
            .onUpdate(
                function(){
                    that.staticCar.rotation.x = -origen2.angle;
                }
            );
        animacion2.start();
    }


    //
    // ─── VOLVER A LA SALIDA ─────────────────────────────────────────────────────────
    // Reinicializa todos los valores de los atributos y sitúa el coche en la salida
        
    volverASalida(){
        this.colision = false;
        this.animacionColision = false;
        this.ganador = false;
        this.velocidadActual = 0;
        this.tActual = 0;
        var posicion = this.path.getPointAt(0);
        this.staticCar.position.copy(posicion);
        var tangente = this.path.getTangentAt(0);
        posicion.add(tangente.multiplyScalar(50));
        this.staticCar.lookAt(posicion);
    }

    //
    // ─── METODO UPDATE ──────────────────────────────────────────────────────────────
    //        
    update () {

        // Actualizamos Tween, aunque realmente solo actúa cuando hay colisión
        TWEEN.update();

        if(!this.colision && !this.ganador)     // Si no ha habido accidente ni victoria, acelera
            this.acelera();
        else{                                   // Si ha ocurrido algo
            if(!this.ganador){                  // Si no ha ganado, es porque ha colisionado
                if(!this.animacionColision){    // Activamos la animación de la colisión
                    this.choca();
                    this.animacionColision = true;
                }
            }
        }
    }

}

// Constantes para gestionar la velocidad del coche
Car.VELOCIDAD_CTE = 0;
Car.ACELERANDO    = 1;
Car.FRENANDO      = 2;

// NOTE La clase Car realmente no hay que entenderla como un coche, ya que 
// realmente no es un coche, no añade geometría, es una clase que encapsula el
// comportamiento y los movimientos de un coche, que es su atributo staticCar.
// Por así decirlo, es el mando de un coche teledirijido.

// ────────────────────────────────────────────────────────────────────────────────

export { Porsche911, Car , Ferrari}