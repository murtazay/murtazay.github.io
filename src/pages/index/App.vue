<template>
  <v-app>
    <v-app-bar app>
      <v-toolbar-title class="headline text-uppercase">
        <span>Murtaza</span>
        <span class="font-weight-light">Y</span>
      </v-toolbar-title>
    </v-app-bar>

    <v-container
        fill-height>
        <v-row>
            <v-col>
                <p class="lead text-center">
                    This website is used to showcase the various projects that I worked on while a student at the City College of New York.
                    Aside from the various descriptions I will also try to include links for the various classes.
                </p>
            </v-col>
        </v-row>
        <v-row>
            <v-col>
                <v-card>
                    <v-card-title>Image Processing</v-card-title>
                    <v-card-subtitle>CSC47000</v-card-subtitle>
                    <v-card-text>
                        This is a image processing course. The following programming languages were used: C++, GLSL, and the QT framework.
                    </v-card-text>
                    <v-card-actions>
                        <v-btn class="primary">
                            Coming Soon...
                        </v-btn>
                    </v-card-actions>
                </v-card>
            </v-col>
            <v-col>
                <v-card>
                    <v-card-title>Computer Graphics</v-card-title>
                    <v-card-subtitle>CSC47200</v-card-subtitle>
                    <v-card-text>
                        This is a computer graphics course. The following programming languages were used: C++, GLSL, and the QT framework.
                    </v-card-text>
                    <v-card-actions>
                        <v-btn class="primary" href="/csc47200">
                            See Projects
                        </v-btn>
                    </v-card-actions>
                </v-card>
            </v-col>
        </v-row>
    </v-container>
  </v-app>
</template>

<script>

    export default {
        name: "App",
        components: {
        },
        data: () => ({
        }),
        created(){
            this.$vuetify.theme.dark = true
        }
    };
</script>
