typedef struct latticeNode {
    double distribution[9];
    double stream[9];
    double density;
    double ux;
    double uy;
    double curl;
    int barrier;
} latticeNode;
extern int px_per_node;
extern latticeNode *lattice;
extern const int lattice_height;
extern const int lattice_width;