<template lang="html">
  <v-container>
    <v-row>
      <v-col>
        <div id="triangle_strip"></div>
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
    ]
  }),
  methods: {
    initLine: function() {
      const container = document.getElementById("triangle_strip");
      const camera = new Three.PerspectiveCamera(
        45,
        container.clientWidth / container.clientHeight,
        0.1,
        100
      );
      camera.position.x = 5;
      camera.position.y = 5;
      camera.position.z = 10;

      const scene = new Three.Scene();

      var geometry = new Three.BufferGeometry();

      geometry.addAttribute(
        "position",
        new Three.Float32BufferAttribute(this.vertices, 3)
      );

      const material = new Three.LineBasicMaterial({
        color: "#0000ff"
      });

      var drawing = new Three.Mesh(geometry, material);
      drawing.drawMode = Three.TriangleStripDrawMode;

      scene.add(drawing);

      const renderer = new Three.WebGLRenderer({
        antialias: true
      });

      renderer.setSize(container.clientWidth, container.clientHeight);

      container.appendChild(renderer.domElement);
      renderer.render(scene, camera);
    },
    init: function() {
      this.initLine();
    }
  },
  mounted() {
    this.init();
  }
};
</script>

<style lang="css" scoped>
#triangle_strip{
    height: 250px;
}
</style>
