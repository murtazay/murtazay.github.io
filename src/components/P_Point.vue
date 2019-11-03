<template lang="html">
  <v-container>
    <v-row>
      <v-col>
        <div id="points"></div>
      </v-col>
    </v-row>
  </v-container>
</template>

<script>
import * as Three from "three";

export default {
  data: () => ({
    vertices: [
      7.0,
      7.5,
      0.0,
      7.5,
      6.5,
      0.0,
      7.0,
      5.5,
      0.0,
      2.5,
      5.5,
      0.0,
      2.5,
      4.5,
      0.0,
      7.5,
      4.5,
      0.0,
      8.0,
      5.5,
      0.0,
      8.5,
      6.5,
      0.0,
      8.0,
      7.5,
      0.0,
      7.5,
      8.5,
      0.0,
      1.5,
      8.5,
      0.0,
      1.5,
      1.5,
      0.0,
      1.0,
      1.0,
      0.0,
      3.0,
      1.0,
      0.0,
      2.5,
      1.5,
      0.0,
      2.5,
      7.5,
      0.0
    ],
    scene: null,
    controls: null,
    camera: null,
    renderer: null
  }),
  methods: {
    initPoints: function() {
      const container = document.getElementById("points");
      this.camera = new Three.PerspectiveCamera(
        45,
        container.clientWidth / container.clientHeight,
        0.1,
        100
      );
      this.camera.position.x = 5;
      this.camera.position.y = 5;
      this.camera.position.z = 10;

      this.scene = new Three.Scene();

      var geometry = new Three.BufferGeometry();

      geometry.addAttribute(
        "position",
        new Three.Float32BufferAttribute(this.vertices, 3)
      );

      const material = new Three.PointsMaterial({
        color: "#0000ff",
        size: 1
      });

      var drawing = new Three.Points(geometry, material);

      this.scene.add(drawing);

      this.renderer = new Three.WebGLRenderer({
        antialias: true
      });

      this.renderer.setSize(container.clientWidth, container.clientHeight);

      container.appendChild(this.renderer.domElement);
      this.renderer.render(this.scene, this.camera);
    },
    init: function() {
      this.initPoints();
    }
  },
  mounted() {
    this.init();
  }
};
</script>

<style lang="css" scoped>
#points{
    height: 250px;
}
</style>
