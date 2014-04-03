#include <stdlib.h>
#include <stdio.h>
#include <math.h>
#include "shared.h"
#include <SDL/SDL.h>

#ifdef EMSCRIPTEN
    #include <emscripten.h>
#endif

const int canvas_width = 800;
const int canvas_height = 480;

void stream();
void collide();
void init_lattice(int width, int height);
void set_boundaries(double flow_speed);
void set_equilibrium(double ux, double uy, double rho, latticeNode *node);
void push(double ux, double uy, double rho, latticeNode *node);

int num_colors = 400;
int color_array[400];

SDL_Surface *screen;


double hue2rgb(double p, double q, double t){
    if(t < 0) t += 1;
    if(t > 1) t -= 1;
    if(t < 1.0/6.0) return p + (q - p) * 6.0 * t;
    if(t < 1.0/2.0) return q;
    if(t < 2.0/3.0) return p + (q - p) * (2.0/3.0 - t) * 6.0;
    return p;
}

int hslToRgb(double h, double s, double l){
    double r, g, b;

    if(s == 0){
        r = g = b = l;
    } else {
        double q = l < 0.5 ? l * (1 + s) : l + s - l * s;
        double p = 2 * l - q;
        r = hue2rgb(p, q, h + 1.0/3.0);
        g = hue2rgb(p, q, h);
        b = hue2rgb(p, q, h - 1.0/3.0);
    }
    r = floor(r * 255);
    g = floor(g * 255);
    b = floor(b * 255);
    if (r > 255) {r = 255;}
    if (g > 255) {g = 255;}
    if (b > 255) {b = 255;}
    if (r < 0) {r = 0;}
    if (g < 0) {g = 0;}
    if (b < 0) {b = 0;}
    // convert to hex
    return (r*256*256)+(g*256)+b;
}

int get_color(double min, double max, double val) {
    double left_span = max - min + 0.0;
    double value_scaled = val - min / left_span;
    double h = (1.0 - value_scaled);
    double s = 1.0;
    double l = value_scaled / 2.0;
    return hslToRgb(h, s, l);
}

void compute_color_array(int n){
    int i;
    for (i = 0; i < n; i++){
        color_array[i] = get_color(n, i, 0.0);
    }
}

void putpixel(int x, int y, int color){
    unsigned int *ptr = (unsigned int*)screen->pixels;
    int lineoffset = y * (screen->pitch / sizeof( unsigned int ));
    ptr[lineoffset + x] = color;
}

void draw_square(int x, int y, int color_index){
    int xpx, ypx;
    for (ypx = y * px_per_node; ypx < (y+1) * px_per_node; ypx++) {
        for (xpx = x * px_per_node; xpx < (x + 1) * px_per_node; xpx++) {
            putpixel(xpx, ypx, color_array[color_index]);
        }
    }
}

void render(){ 
    int x, y;
    double speed;
    int color_index;
    SDL_LockSurface(screen);
    for (x = 0; x < lattice_width; x++){
        for (y = 0; y < lattice_height; y++){
            speed = sqrt(pow(lattice[x+y*lattice_width].ux, 2) + pow(lattice[x+y*lattice_width].uy, 2));
            color_index = (int)((speed + 0.21) * num_colors);
            draw_square(x, y, color_index);
        }
    }
    SDL_UnlockSurface(screen);
    SDL_UpdateRect(screen, 0, 0, canvas_width, canvas_height);    
}

void getInput(){
    SDL_Event event;
    /* Loop through waiting messages and process them */
    while (SDL_PollEvent(&event)){
        switch (event.type){
            /* Closing the Window or pressing Escape will exit the program */
            case SDL_QUIT:
                exit(0);
            break;
            
            case SDL_MOUSEMOTION:
                if (SDL_MOUSEBUTTONDOWN && event.button.button == SDL_BUTTON_LEFT){
                    // convert to lattice coordinates
                    int xcoord, ycoord;
                    double xspeed, yspeed;
                    xcoord = (int)event.motion.x / px_per_node;
                    ycoord = (int)event.motion.y / px_per_node;
                    xspeed = (double)event.motion.xrel;
                    yspeed = (double)event.motion.yrel;
                    // make sure push isn't too large
                    if (xspeed > 0.1) { xspeed = 0.1;}
                    if (xspeed < -0.1) { xspeed = -0.1;}
                    if (yspeed > 0.1) { yspeed = 0.1;}
                    if (yspeed < -0.1) { yspeed = -0.1;}
                    // EM_ASM_INT({
                    //     Module.print('Moosex: ' + $0);
                    //     Module.print('Mousey: ' + $1);
                    // }, xspeed, yspeed);
                    //get node
                    // push
                    int x, y;
                    for (x=0; x<5; x++){
                        for (y=0; y<5; y++){
                            if (xcoord + x >= 0 && xcoord + x < lattice_width &&
                                ycoord + y >= 0 && ycoord + y < lattice_height &&
                                !lattice[(xcoord+x)+(ycoord+y)*lattice_width].barrier &&
                                sqrt((x * x) + (y * y)) < 5) {
                                push(xspeed, yspeed, lattice[(xcoord+x)+(ycoord+y)*lattice_width].density, &lattice[(xcoord+x)+(ycoord+y)*lattice_width]);
                            }
                        }
                    }
                    x = 10;
                }
            break;

            case SDL_MOUSEBUTTONDOWN:
                if (event.button.button == SDL_BUTTON_RIGHT){
                    ;
                }
            break;
        }
    }
}


void loop(){
    int steps = 10;
    set_boundaries(0);
    while (steps > 0){
        stream();
        collide();
        steps--;
    }
    getInput();
    render();
}

int main(){
    px_per_node = canvas_width/lattice_width;
    lattice = (latticeNode *)malloc((lattice_width * lattice_height) * sizeof(latticeNode));
    init_lattice(lattice_width, lattice_height);
    SDL_Init(SDL_INIT_VIDEO);
    atexit(SDL_Quit);
    compute_color_array(num_colors);
    screen = SDL_SetVideoMode(canvas_width, canvas_height, 32, SDL_SWSURFACE);
    // Main update loop
    #ifdef EMSCRIPTEN
        emscripten_set_main_loop(loop, 0, 1);
    #else
        while (1) {
            loop();
            //SDL_Delay(10);
        }
    #endif
    return 1;
}