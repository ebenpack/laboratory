# Project Wavybits #

Attempt to minify Boltzmann project.

A much more performant and feature rich version of this project can be found [here](https://github.com/ebenpack/laboratory/tree/master/JS/boltzmann)([demo](https://rawgithub.com/ebenpack/laboratory/master/JS/boltzmann/index.html)).

Some things I'm particularly proud/ashamed of:

*Flattening every loop
    for (x=0;x<X*Y;x++)
        y_pos = F(x/lattice_dim);
        x_pos = x%lattice_dim;

*" 0 0 1 0 0-1-1 0 0 1 1-1-1-1-1 1 1 1"

*   if (D) {
            weight = (D<5)?1/9:1/36;
        } else {
            weight = 4/9;
        }

* equilibrium no return

*   for (i = 0; i < 36; i++)
        V = 4*(i%6+6*x_pos+600*(F(i/6)+6*y_pos));

* 'I ain't got time to var.' Every single variable in the global scope. Closure compiler doesn't rename globals, so this step was performed last. This was particularly difficult, as it required some careful bookkeeping to keep the different variables straight. And since this must be done by hand, once this step is performed, your program becomes very difficult to follow.