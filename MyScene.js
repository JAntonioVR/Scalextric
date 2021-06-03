
// Clases de la biblioteca

import * as THREE from '../libs/three.module.js'
import { GUI } from '../libs/dat.gui.module.js'
import { TrackballControls } from '../libs/TrackballControls.js'


// Clases de mi proyecto

import { Circuito } from './circuito.js'
 

//
// ──────────────────────────────────────────────────────────────────────────
//   :::::: C L A S E   E S C E N A : :  :   :    :     :        :          :
// ──────────────────────────────────────────────────────────────────────────
//

class MyScene extends THREE.Scene {
  
	//
	// ─── CONSTRUCTOR ────────────────────────────────────────────────────────────────
	// Crea y añade al grafo de escena todos los elementos que se visualizarán	
  	constructor (myCanvas) { 
		super();
		
		// Lo primero, crear el visualizador, pasándole el lienzo sobre el que realizar los renderizados.
		this.renderer = this.createRenderer(myCanvas);

		// Usamos este atributo para diferenciar cuando se juega solo y cuando juegan dos jugadores
		// (Para renderizar uno o dos viewport)
		this.dosJugadores = false;
		
		// Se crea la interfaz gráfica de usuario
		this.gui = this.createGUI ();

		// Necesitaremos un reloj para gestionar la velocidad de giro de cámara en primera persona
		// con independencia del ordenador que ejecute
		this.clock = new THREE.Clock();
		
		// Construimos los distintos elementos que tendremos en la escena
		
		// Todo elemento que se desee sea tenido en cuenta en el renderizado de la escena debe pertenecer a esta. Bien como hijo de la escena (this en esta clase) o como hijo de un elemento que ya esté en la escena.
		// Tras crear cada elemento se añadirá a la escena con   this.add(variable)
		
		// Creamos las luces ambientales
		this.createLights ();

		// Creamos los objetos, que serán tenidos en cuenta a la hora de crear las cámaras en primera persona
		// El modelo puede incluir su parte de la interfaz gráfica de usuario. Le pasamos la referencia a 
		// la gui y el texto bajo el que se agruparán los controles de la interfaz que añada el modelo.

		this.circuito             = new Circuito (this.gui);
		this.circuito.position.y += 2;
		this.add(this.circuito)

		// Para que el circuito y todos sus nodos reciban sombras
		this.circuito.traverseVisible(
			function(nodo){
				nodo.castShadow    = true;
				nodo.receiveShadow = true;
			}
		)

		// Creamos las cámaras
		this.createCamera ();
		
		// Un suelo 
		this.createGround ();
		
		// Y unos ejes. Imprescindibles para orientarnos sobre dónde están las cosas
		this.axis         = new THREE.AxesHelper (100);
		this.axis.visible = false;                       // Inicialmente que no se vean
		this.add (this.axis);
	}
	

	//
	// ─── CREACIÓN DE CAMARAS ────────────────────────────────────────────────────────
	// Crea las cámaras y las estructuras necesarias para su gestión

	createCamera () {

		//
		// ─── CREAMOS TRES CÁMARAS ────────────────────────────────────────
		//
		
		// Cámara TB: Cámara General
			
		// Para crear una cámara le indicamos
		//   El ángulo del campo de visión vértical en grados sexagesimales
		//   La razón de aspecto ancho/alto
		//   Los planos de recorte cercano y lejano
		var camaraTB = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 1000);
		// También se indica dónde se coloca
		camaraTB.position.set (30, 15, 0);
		// Y hacia dónde mira
		var look = new THREE.Vector3 (0,0,0);
		camaraTB.lookAt(look);
		this.add (camaraTB);
		
		// Para el control de cámara usamos una clase que ya tiene implementado los movimientos de órbita
		this.cameraControl = new TrackballControls (camaraTB, this.renderer.domElement);
		
		// Se configuran las velocidades de los movimientos
		this.cameraControl.rotateSpeed = 5;
		this.cameraControl.zoomSpeed   = -2;
		this.cameraControl.panSpeed    = 0.5;
		// Debe orbitar con respecto al punto de mira de la cámara
		this.cameraControl.target = look;

		this.cameraTB = camaraTB;

		// Cámaras en primera persona 

		var target = new THREE.Vector3( 10, 4, 0); // Punto al que mirarán inicialmente las cámaras

		// Cámara PP1: Cámara en Primera Persona en el coche 1 (el Porsche)

		var camaraPP1 = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 1000);
		var coche1 = this.circuito.getCar(1).getStaticCar();
		coche1.add(camaraPP1);
		camaraPP1.position.set(2.5,2.7,0);
		camaraPP1.lookAt(target);

		this.cameraPP1 = camaraPP1;

		// Cámara PP2: Cámara en Primera Persona en el coche 2 (el Ferrari)

		var camaraPP2 = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 1000);

		var coche2 = this.circuito.getCar(2).getStaticCar();
		coche2.add(camaraPP2);
		camaraPP2.position.set(-2.5,2.7,0);
		camaraPP2.lookAt(target);

		this.cameraPP2 = camaraPP2;

		//
		// ─── CONFIGURACIÓN DEL USO DE LAS CÁMARAS ────────────────────────
		//	

		
		this.camera      = this.cameraTB;									   // Inicialmente usamos la cámara general
		this.camaraPP    = false;                                              // Atributo que indica si se está usando o no una cámara en primera persona (útil en update())
		this.camaras     = [ this.cameraTB, this.cameraPP1, this.cameraPP2 ];  // Array de cámaras disponibles
		this.cameraIndex = 0;                                                  // Índice de la cámara que se está usando actualmente

		this.cameraPPState = MyScene.CAMARA_QUIETA; // Estado de la cámara en primera persona (Ver al final de la clase)
		
	}

	
	//
	// ─── CAMBIO DE CAMARA ───────────────────────────────────────────────────────────
	// Cambia la cámara utilizada a la siguiente en el array de cámaras
		
	changeCamera(){
		this.cameraIndex = (this.cameraIndex+1) % 3;
		this.camera      = this.camaras[this.cameraIndex];
		if(this.cameraIndex == 0) this.camaraPP = false;
		else 					  this.camaraPP = true;
	}
  

	//
	// ─── CREACION DEL SUELO ─────────────────────────────────────────────────────────
	// Crea el suelo de nuestro modelo

	createGround () {
		// El suelo es un Mesh, necesita una geometría y un material.
		
		// La geometría es una caja con muy poca altura
		var geometryGround = new THREE.BoxGeometry (500,0.2,400);
		
		// El material se hará con una textura de madera
		var texture        = new THREE.TextureLoader().load('./img/wood.jpg');
		var materialGround = new THREE.MeshPhongMaterial ({map: texture});
		
		// Ya se puede construir el Mesh
		var ground = new THREE.Mesh (geometryGround, materialGround);
		
		// Configuramos para que pueda recibir sombras
		ground.receiveShadow = true;
		
		// Todas las figuras se crean centradas en el origen.
		// El suelo lo bajamos la mitad de su altura para que el origen del mundo se quede en su lado superior
		ground.position.y = -0.1;
		
		// Que no se nos olvide añadirlo a la escena, que en este caso es  this
		this.add (ground);
	}
  

	//
	// ─── CREACION DE INTERFAZ GRAFICA ───────────────────────────────────────────────
	// Se crea la interfaz gráfica con todos los parámetros de la escena
		
	createGUI () {
		// Se crea la interfaz gráfica de usuario
		var gui = new GUI();
		
		// La escena le va a añadir sus propios controles. 
		// Se definen mediante una   new function()
		// En este caso la intensidad de la luz, si se muestran o no los ejes y el modo nocturno
		this.guiControls = new function() {
		// En el contexto de una función   this   alude a la función
			this.lightIntensity = 0.5;
			this.axisOnOff      = false;
			this.modoNocturno   = false;
		}

		var that = this;

		// Se crea una sección para los controles de esta clase
		var folder = gui.addFolder ('Escena');
		
		// Se le añade un control para la intensidad de la luz
		folder.add (this.guiControls, 'lightIntensity', 0, 1, 0.1).name('Intensidad de la Luz : ').onChange(
			function(){
				// Se actualiza la intensidad de la luz con lo que haya indicado el usuario en la gui
				that.spotLight.intensity = that.guiControls.lightIntensity;
			}
		);
		
		// Uno para mostrar u ocultar los ejes
		folder.add (this.guiControls, 'axisOnOff').name ('Mostrar ejes : ').onChange(
			function(){
				// Se muestran o no los ejes según lo que idique la GUI
				that.axis.visible = that.guiControls.axisOnOff;
			}
		);

		// Y por último, el modo nocturno
		folder.add (this.guiControls, 'modoNocturno').name('Modo nocturno : ').onChange(
			function(){
				if(that.guiControls.modoNocturno){
					that.ambientLightNight.visible = true;
					that.ambientLightDay.visible   = false;
				}
					
				else{
					that.ambientLightNight.visible = false;
					that.ambientLightDay.visible   = true;
				}
			}
		)

		return gui;
	}


	//
	// ─── CREACION DE LUCES ──────────────────────────────────────────────────────────
	// Creamos las luces ambientales y una focal

	createLights () {
		// Se crean luces ambientales (día y noche), evita que se vean complentamente negras las zonas donde no incide de manera directa una fuente de luz
		// La luz ambiental solo tiene un color y una intensidad
		this.ambientLightDay   = new THREE.AmbientLight(0xbaf5e3, 0.5);
		this.ambientLightNight = new THREE.AmbientLight(0x131862, 0.5);
		// La añadimos a la escena
		this.add (this.ambientLightDay);
		this.ambientLightNight.visible = false;
		this.add (this.ambientLightNight);
		
		// Se crea una luz focal que va a ser la luz principal de la escena
		// La luz focal, además tiene una posición, y un punto de mira
		// Si no se le da punto de mira, apuntará al (0,0,0) en coordenadas del mundo
		// En este caso se declara como   this.atributo   para que sea un atributo accesible desde otros métodos.
		this.spotLight = new THREE.SpotLight( 0xffffff, this.guiControls.lightIntensity );
		this.spotLight.position.set( 0, 200, 0 );
		this.add (this.spotLight);
	}


	//
	// ─── CREACION DEL RENDERER ──────────────────────────────────────────────────────
	// Se crea y configura el renderer de la escena 

	createRenderer (myCanvas) {
		// Se recibe el lienzo sobre el que se van a hacer los renderizados. Un div definido en el html.
		
		// Se instancia un Renderer   WebGL
		var renderer = new THREE.WebGLRenderer();
		
		// Se establece un color de fondo en las imágenes que genera el render
		renderer.setClearColor(new THREE.Color(0xEEEEEE), 1.0);
		
		// Se establece el tamaño, se aprovecha la totalidad de la ventana del navegador
		renderer.setSize(window.innerWidth, window.innerHeight);
		
		// Se habilita el cálculo de sombras arrojadas
		renderer.shadowMap.enabled = true;
		// Se indica el método de cálculo (sombras duras)
		renderer.shadowMap.type = THREE.BasicShadowMap;

		
		// La visualización se muestra en el lienzo recibido
		$(myCanvas).append(renderer.domElement);
		
		return renderer;  
	}
	
	
	//
	// ─── GETTER DE LA CAMARA ────────────────────────────────────────────────────────
	// Devuelve la cámara que estamos usando actualmente
		
	getCamera () {
		return this.camera;
	}


	//
	// ─── GESTOR DE TECLA PULSADA ────────────────────────────────────────────────────
	// Se ejecuta al detectar que se ha pulsado una tecla

	onKeyDown(event){
		var tecla = event.wich || event.keyCode;
		
		// Teclas para manejar los coches
		if(String.fromCharCode(tecla) == "W")
			this.circuito.aceleraCoche(1);
		if(String.fromCharCode(tecla) == "O")
			this.circuito.aceleraCoche(2);
		if(String.fromCharCode(tecla) == "S")
			this.circuito.frenaCoche(1);
		if(String.fromCharCode(tecla) == "L")
			this.circuito.frenaCoche(2);
		
		// Teclas para resetear la posición y el estado de los coches
		if(String.fromCharCode(tecla) == "A")
			this.circuito.reseteaCoche(1);
		if(String.fromCharCode(tecla) == "K")
			this.circuito.reseteaCoche(2);
		if(String.fromCharCode(tecla) == "R")
			this.circuito.nuevoJuego();

		// Teclas para mover la cámara cuando se usa una en primera persona
		if(tecla == 37)
			this.cameraPPState = MyScene.CAMARA_IZDA;
		if(tecla == 38)
			this.cameraPPState = MyScene.CAMARA_SUBIENDO;
		if(tecla == 39)
			this.cameraPPState = MyScene.CAMARA_DCHA;
		if(tecla == 40)
			this.cameraPPState = MyScene.CAMARA_BAJANDO;

		// Cambio de cámara, y modo 1/2 jugadores
		if(String.fromCharCode(tecla) == "C")
			this.changeCamera();
		if(String.fromCharCode(tecla) == "X")
			this.dosJugadores = !this.dosJugadores;
			
	}


	//
	// ─── GESTOR DE TECLA LEVANTADA ──────────────────────────────────────────────────
	// Se ejecuta cada vez que se levanta una tecla
		
  	onKeyUp(event){
		var tecla = event.wich || event.keyCode;

		// Teclas para manejar los coches
		if(String.fromCharCode(tecla) == "W")
			this.circuito.estabilizaCoche(1);
		if(String.fromCharCode(tecla) == "O")
			this.circuito.estabilizaCoche(2);
		if(String.fromCharCode(tecla) == "S")
			this.circuito.estabilizaCoche(1);
		if(String.fromCharCode(tecla) == "L")
			this.circuito.estabilizaCoche(2);

		// Teclas para mover la cámara en primera persona
		if(tecla >= 37 && tecla <=40 )
			this.cameraPPState = MyScene.CAMARA_QUIETA;
		
  	}
    

  	//
  	// ─── CAMBIO DE TAMAÑO DE VENTANA ────────────────────────────────────────────────
  	// Se ejecuta cuando hay cambio de tamaño de la ventana

	onWindowResize () {
		// Este método es llamado cada vez que el usuario modifica el tamapo de la ventana de la aplicación
		// Hay que actualizar el ratio de aspecto de la cámara
		this.setCameraAspect (window.innerWidth / window.innerHeight);
		
		// Y también el tamaño del renderizador
		this.renderer.setSize (window.innerWidth, window.innerHeight);
	}


	//
	// ─── RENDERIZAR VIEWPORT ────────────────────────────────────────────────────────
	// Renderiza una escena concreta, con una cámara concreta en la región de la
	// pantalla que se le indica
 
  	renderViewport(escena, camara, left, top, width, height){
		var l = left   * window.innerWidth,
		    t = top    * window.innerHeight,
		    w = width  * window.innerWidth,
		    h = height * window.innerHeight;

		this.renderer.setViewport(l,t,w,h);
		this.renderer.setScissor(l,t,w,h);
		this.renderer.setScissorTest(true);
		camara.aspect = w/h;
		camara.updateProjectionMatrix();
		this.renderer.render(escena, camara);
		
	}

	
	//
	// ─── ACTUALIZADOR DEL RATIO DE CAMARA ───────────────────────────────────────────
	// Actualiza el ratio de aspecto de cámara	

	setCameraAspect (ratio) {
		// Cada vez que el usuario modifica el tamaño de la ventana desde el gestor de ventanas de
		// su sistema operativo hay que actualizar el ratio de aspecto de la cámara
		this.camera.aspect = ratio;
		// Y si se cambia ese dato hay que actualizar la matriz de proyección de la cámara
		this.camera.updateProjectionMatrix();
	}


	//
	// ─── UPDATE ─────────────────────────────────────────────────────────────────────
	// Operaciones que deben ejecutarse en cada frame
		
	update () {
		
		// Renderizamos uno o dos viewport según el modo de juego
		if(this.dosJugadores){
			this.renderViewport (this, this.cameraPP2, 0,0, 1,0.5);
			this.renderViewport (this, this.cameraPP1, 0,0.5, 1,0.5);
		}
		else{
			this.renderViewport (this, this.getCamera(), 0,0, 1,1);
		}
		
		// Actualizamos la orientación de la cámara en primera persona o el controlador si
		// usamos la cámara general
		if(this.camaraPP){
			// Se actualizan las rotaciones de acuerdo al estado de la camara según las teclas
			var segundos = this.clock.getDelta();
			var incremento = segundos; // Girar tantos radianes como segundos es una buena medida
			if(this.cameraPPState == MyScene.CAMARA_IZDA)
				this.camera.rotation.y -= incremento;
			if(this.cameraPPState == MyScene.CAMARA_SUBIENDO)
				this.camera.rotation.x -= incremento;
			if(this.cameraPPState == MyScene.CAMARA_DCHA)
				this.camera.rotation.y += incremento;
			if(this.cameraPPState == MyScene.CAMARA_BAJANDO)
				this.camera.rotation.x += incremento;
		}
		else{
			// Se actualiza la posición de la cámara según su controlador
			this.cameraControl.update();
		}
		
		// Se actualiza el circuito
		this.circuito.update();
		
		// Este método debe ser llamado cada vez que queramos visualizar la escena de nuevo.
		// Literalmente le decimos al navegador: "La próxima vez que haya que refrescar la pantalla, llama al método que te indico".
		// Si no existiera esta línea,  update()  se ejecutaría solo la primera vez.
		requestAnimationFrame(() => this.update())
	}
}

// Constantes para gestionar el manejo de la cámara en primera persona
MyScene.CAMARA_QUIETA   = 0;
MyScene.CAMARA_SUBIENDO = 1;
MyScene.CAMARA_BAJANDO  = 2;
MyScene.CAMARA_IZDA     = 3;
MyScene.CAMARA_DCHA     = 4;




/// La función   main
$(function () {
  
  // Se instancia la escena pasándole el  div  que se ha creado en el html para visualizar
  var scene = new MyScene("#WebGL-output");

  // Se añaden los listener de la aplicación. En este caso, 
  // el que va a comprobar cuándo se modifica el tamaño de la ventana de la aplicación y
  // los de pulsar/levantar tecla
  window.addEventListener ("resize", () => scene.onWindowResize());
  window.addEventListener ("keydown", (event) => scene.onKeyDown(event), true);
  window.addEventListener ("keyup", (event) => scene.onKeyUp(event), true);
  
  // Que no se nos olvide, la primera visualización.
  scene.update();
});
