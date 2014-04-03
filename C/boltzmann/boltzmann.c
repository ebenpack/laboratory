#include <stdlib.h>
#include <stdio.h>
#include <math.h>
#include "shared.h"

const double four9ths = 4.0/9.0;
const double one9th = 1.0/9.0;
const double one36th = 1.0/36.0;
const int node_directions[9][2] = {{0, 0},{1,0},{0,-1},{-1,0},{0,1},{1,-1},{-1,-1},{-1,1},{1,1}};
const int reflection[9] = {0,3,4,1,2,7,8,5};
const double omega = 1.7;
const int lattice_height = 80;
const int lattice_width = 200;

latticeNode *lattice;

int px_per_node;

void equilibrium(double ux, double uy, double rho, double eq[]){
    double ux3 = 3 * ux;
    double uy3 = 3 * -uy;
    double ux2 = ux * ux;
    double uy2 = -uy * -uy;
    double uxuy2 = 2 * ux * -uy;
    double u2 = ux2 + uy2;
    double u215 = 1.5 * u2;
    eq[0] = (four9ths * rho * (1 - u215));
    eq[1] = (one9th * rho * (1 + ux3 + 4.5*ux2 - u215));
    eq[2] = (one9th * rho * (1 + uy3 + 4.5*uy2 - u215));
    eq[3] = (one9th * rho * (1 - ux3 + 4.5*ux2 - u215));
    eq[4] = (one9th * rho * (1 - uy3 + 4.5*uy2 - u215));
    eq[5] = (one36th * rho * (1 + ux3 + uy3 + 4.5*(u2+uxuy2) - u215));
    eq[6] = (one36th * rho * (1 - ux3 + uy3 + 4.5*(u2-uxuy2) - u215));
    eq[7] = (one36th * rho * (1 - ux3 - uy3 + 4.5*(u2+uxuy2) - u215));
    eq[8] = (one36th * rho * (1 + ux3 - uy3 + 4.5*(u2-uxuy2) - u215));
}

void init_barrier(latticeNode *node){
    node->barrier = 0;
}

void init_flow(int ux, int uy, int rho, latticeNode *node) {
    int i;
    if (!node->barrier) {
        double eq[9];
        equilibrium(ux, uy, rho, eq);
        node->density = rho;
        node->ux = ux;
        node->uy = uy;
        node->curl = 0.0;
        for (i=0; i<9; i++){
            node->distribution[i] = eq[i];
            node->stream[i] = eq[i];
        }
    }
}

void set_equilibrium(double ux, double uy, double rho, latticeNode *node) {
    double eq[9];
    equilibrium(ux, uy, rho, eq);
    node->distribution[0] = (node->distribution[0] + (omega * (eq[0] - node->distribution[0])));
    node->distribution[1] = (node->distribution[1] + (omega * (eq[1] - node->distribution[1])));
    node->distribution[2] = (node->distribution[2] + (omega * (eq[2] - node->distribution[2])));
    node->distribution[3] = (node->distribution[3] + (omega * (eq[3] - node->distribution[3])));
    node->distribution[4] = (node->distribution[4] + (omega * (eq[4] - node->distribution[4])));
    node->distribution[5] = (node->distribution[5] + (omega * (eq[5] - node->distribution[5])));
    node->distribution[6] = (node->distribution[6] + (omega * (eq[6] - node->distribution[6])));
    node->distribution[7] = (node->distribution[7] + (omega * (eq[7] - node->distribution[7])));
    node->distribution[8] = (node->distribution[8] + (omega * (eq[8] - node->distribution[8])));
}

void push(double ux, double uy, double rho, latticeNode *node) {
    double eq[9];
    equilibrium(ux, uy, rho, eq);
    node->distribution[0] = eq[0];
    node->distribution[1] = eq[1];
    node->distribution[2] = eq[2];
    node->distribution[3] = eq[3];
    node->distribution[4] = eq[4];
    node->distribution[5] = eq[5];
    node->distribution[6] = eq[6];
    node->distribution[7] = eq[7];
    node->distribution[8] = eq[8];
}

void stream() {
    int i, x, y, d, len;
    for (i = 0, len=lattice_width*lattice_height; i < len; i++) {
        x = i % lattice_width;
        y = floor(i / lattice_width);
        latticeNode node = lattice[x+y*lattice_width];
        if (!node.barrier) {
            for (d = 0; d < 9; d++) {
                int newx, newy;
                newx = node_directions[d][0] + x;
                newy = node_directions[d][1] + y;
                if (newx >= 0 && newx < lattice_width && newy >= 0 && newy < lattice_height) {
                    if (lattice[newx+newy*lattice_width].barrier == 1) {
                        lattice[x+y*lattice_width].stream[reflection[d]] = node.distribution[d];
                    } else {
                        lattice[newx+newy*lattice_width].stream[d] = node.distribution[d];
                    }
                }
            }
        }
    }
}

void collide() {
    int x, y;
    for (x = 1; x < lattice_width-1; x++) {
        for (y = 1; y < lattice_height-1;y++) {
            latticeNode *node = &lattice[x+y*lattice_width];
            if (!node->barrier) {
                int p;
                for (p = 0; p < 9; p++) {
                    node->distribution[p] = node->stream[p];
                }
                double rho, ux, uy;
                rho = node->distribution[0] + node->distribution[1] + node->distribution[2] + node->distribution[3] + node->distribution[4] + node->distribution[5] + node->distribution[6] + node->distribution[7] + node->distribution[8];
                ux = (node->distribution[1] + node->distribution[5] + node->distribution[8] - node->distribution[3] - node->distribution[6] - node->distribution[7]) / rho;
                uy = (node->distribution[4] + node->distribution[7] + node->distribution[8] - node->distribution[2] - node->distribution[5] - node->distribution[6]) / rho;
                node->density = rho;
                node->ux = ux;
                node->uy = uy;
                if (x > 0 && x < lattice_width - 1 &&
                    y > 0 && y < lattice_height - 1) {
                    node->curl = lattice[(x+1)+y*lattice_width].uy - lattice[(x-1)+y*lattice_width].uy - lattice[x+(y+1)*lattice_width].ux + lattice[x+(y-1)*lattice_width].ux;
                }
                set_equilibrium(ux, uy, rho, node);
            }
        }
    }
}

void set_boundaries(double flow_speed) {
    int x, y;
    double eq[9];
    equilibrium(flow_speed, 0, 1, eq);
    for (x=0; x<lattice_width-1; x++) {
        set_equilibrium(flow_speed, 0, 1, &lattice[x+0*lattice_width]);
        set_equilibrium(flow_speed, 0, 1, &lattice[x+(lattice_height-1)*lattice_width]);
    }
    for (y=0; y<lattice_height-1; y++) {
        set_equilibrium(flow_speed, 0, 1, &lattice[0+y*lattice_width]);
        set_equilibrium(flow_speed, 0, 1, &lattice[(lattice_width-1)+y*lattice_width]);
    }
}

void init_lattice(int width, int height){
    int x, y;
    for (x=0; x<width; x++){
        for (y=0; y<height; y++){
            init_barrier(&lattice[x+y*width]);
            init_flow(0,0,1,&lattice[x+y*width]);
        } 
    }
}
