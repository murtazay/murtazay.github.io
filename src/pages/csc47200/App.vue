<template>
    <v-app>
        <v-app-bar app>
            <v-toolbar-title class="headline text-uppercase">
                <span>Murtaza</span>
                <span class="font-weight-light">Y</span>
            </v-toolbar-title>
        </v-app-bar>

        <v-content>
            <v-container>
                <v-row class="pb-5">
                    <v-col>
                        <v-card
                            raised
                            shaped>
                            <v-card-title>P</v-card-title>
                            <v-card-subtitle>Draw a P</v-card-subtitle>
                            <v-card-text>
                                <v-row>
                                    <v-col>
                                        <P_Point />
                                        <h2>Points</h2>
                                    </v-col>
                                    <v-col>
                                        <P_Line />
                                        <h2>Line</h2>
                                    </v-col>
                                    <v-col>
                                        <P_Line_Strip />
                                        <h2>Line Strip</h2>
                                    </v-col>
                                    <v-col>
                                        <P_Line_Loop />
                                        <h2>Line Loop</h2>
                                    </v-col>
                                    <v-col>
                                        <P_Triangles />
                                        <h2>Triangles</h2>
                                    </v-col>
                                    <v-col>
                                        <P_Triangle_Strip />
                                        <h2>Triangle Strip</h2>
                                    </v-col>
                                    <v-col>
                                        <P_Triangle_Fan />
                                        <h2>Triangle Fan</h2>
                                    </v-col>
                                </v-row>
                                <v-row>
                                    <v-col>
                                        <p class="text-center">This was the first assignment and was really supposed just give a glimpse of the various things you can do with OpenGL.<br>From the top left to the bottom right the following GL drawmodes are shown:<em><span class="text-success">POINTS, LINES, LINE_STRIP, LINE_LOOP, TRIANGLES, TRIANGLE_STRIP, TRIANGLE_FAN, QUADS, POLYGON.</span></em><br>This also illustrates the differences between WebGL and OpenGL. In WebGL you can only draw <em><span class="text-success">POINTS, LINES, LINE_STRIP, LINE_LOOP, TRIANGLES, TRIANGLE_STRIP, TRIANGLE_FAN.</span></em></p>
                                    </v-col>
                                </v-row>
                            </v-card-text>
                        </v-card>
                    </v-col>
                </v-row>
                <v-row>
                    <v-col>
                        <v-card>
                            <v-card-title>Triangles</v-card-title>
                            <v-card-subtitle>Draw and control Triangles</v-card-subtitle>
                            <v-card-text>
                                <v-row>
                                    <v-col>

                                    </v-col>
                                    <v-col>

                                    </v-col>
                                </v-row>
                                <v-row>
                                    <v-col></v-col>
                                </v-row>
                            </v-card-text>
                        </v-card>
                    </v-col>
                </v-row>
            </v-container>
        </v-content>
    </v-app>
</template>

<script>
    import P_Point from "@/components/P_Point";
    import P_Line from "@/components/P_Line";
    import P_Line_Strip from "@/components/P_Line_Strip";
    import P_Line_Loop from "@/components/P_Line_Loop";
    import P_Triangles from "@/components/P_Triangles";
    import P_Triangle_Strip from "@/components/P_Triangle_Strip";
    import P_Triangle_Fan from "@/components/P_Triangle_Fan";

    export default {
        name: "App",
        components: {
            P_Point,
            P_Line,
            P_Line_Strip,
            P_Line_Loop,
            P_Triangles,
            P_Triangle_Strip,
            P_Triangle_Fan
        },
        data: () => ({
        }),
        created(){
            this.$vuetify.theme.dark = true
        }
    };
</script>
<style>
    div.col{
        padding:0px;
    }

</style>
