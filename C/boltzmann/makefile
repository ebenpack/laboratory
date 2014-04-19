CFLAGS=-Wall
EXPORTED_FUNCTIONS=EXPORTED_FUNCTIONS="['_equilibrium', '_stream', '_collide']"
DIRECTORY=build

all:
	emcc $(CFLAGS) boltzmann.c main.c -s TOTAL_MEMORY=20000000 -o $(DIRECTORY)/main.html

opt:
	emcc $(CFLAGS) boltzmann.c main.c -s TOTAL_MEMORY=20000000 -O3 -o $(DIRECTORY)/main.html

emdebug:
	emcc $(CFLAGS) -O2 --js-opts 0 -g4 boltzmann.c main.c -s ALLOW_MEMORY_GROWTH=1 -o $(DIRECTORY)/main.html

debug:
	gcc $(CFLAGS) -O0 -ggdb boltzmann.c main.c -o $(DIRECTORY)/main-debug -lm -lSDL

opt2:
	clang $(CFLAGS) boltzmann.c main.c -O3 -o $(DIRECTORY)/main-opt -lm -lSDL

prof:
	gcc $(CFLAGS) -O0 -pg boltzmann.c main.c -o $(DIRECTORY)/main-prof -lm -lSDL

valgrind:
	gcc $(CFLAGS) -O0 -g boltzmann.c main.c -o $(DIRECTORY)/main-valg -lm -lSDL

osx:
	clang $(CFLAGS) boltzmann.c main.c -O3 -o build/main-opt `sdl-config --cflags --libs`