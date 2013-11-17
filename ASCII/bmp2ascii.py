#!/usr/local/bin/python3

from __future__ import division
import sys
import imghdr
import argparse
import struct
import math
from PIL import Image

class Pixel(object):
    def __init__(self, red, green, blue, x, y, alpha=255):
        self.red = red
        self.green = green
        self.blue = blue
        self.alpha = alpha
        self.x = x
        self.y = y

    @property
    def coordinates(self):
        return (self.x, self.y)

    def luminance(self):
        '''
        Returns the luminance value of a given RGBA color.
        '''
        # TODO: Does alpha affect luminance?
        luminance_value = math.sqrt( (0.241 * (self.red**2 )) + (0.691 * (self.green**2 )) + (0.068 * (self.blue**2 ) ))
        return luminance_value / 255

class Img(object):
    '''
    Img defines and interface for working with image files for the sole purpose of converting those image files into
    ASCII representations. While creating an Img object is not the most straightforward method of solving this problem,
    the interface that it creates provides a useful abstraction that allows for direct file manipulation of BMP images
    (which was the main purpose of this exercise), while also allowing for manipulation of other image formats using
    the PIL library.
    '''
    def __init__(self, image_file):
        self.image_file = Image.open(image_file)
        self.rgb_img = self.image_file.convert('RGB')
        self.width = self.image_file.size[0]
        self.height = self.image_file.size[1]
        self.aspect_ratio = self.width / self.height
        self.pixel_luminance_map = {}

    def pixel(self, x, y):
        red, green, blue = self.rgb_img.getpixel((x,y))
        return Pixel(red, green, blue, x, y)

    def pixel_luminance(self, x, y):
        """
        Return luminance of pixel at coordinates x, y
        """
        # TODO: should this be memoized with a decorator? Does this even need to be memoized?
        if (x, y) in self.pixel_luminance_map:
            return self.pixel_luminance_map[(x,y)]
        else:
            pixel = self.pixel(x,y)
            pixel_luminance = pixel.luminance()
            self.pixel_luminance_map[(x,y)] = pixel_luminance
            return pixel_luminance

    def pixel_region(self, x, y, x_size, y_size):
        '''
        Returns a 2-dimensional list containing the pixel values from a rectangular region from x, y to
        x + x_size, y + y_size.
        '''
        region = []
        for row in range(x_size):
            new_row = []
            new_y = y + row # TODO: Need better variable names for these.
            for column in range(y_size):
                new_x = x + column
                new_row.append(self.pixel(new_x, new_y))
            region.append(new_row)
        return region

    def region_luminance(self, x, y, x_size, y_size):
        '''
        Returns the average luminance (in the range 0.0 to 1.0) of the given pixel region.
        '''
        luminance_total = 0
        items_total = 0.0
        region = self.pixel_region(x, y, x_size, y_size)
        for row in region:
            for pixel in row:
                if pixel.coordinates not in self.pixel_luminance_map:
                    self.pixel_luminance(pixel.x, pixel.y)
                luminance_total += self.pixel_luminance_map[pixel.coordinates]
                items_total += 1
        return luminance_total / items_total

class Bmp(Img):
    def __init__(self, image_file):
        super(Bmp, self).__init__(image_file)
        self.image_file = image_file
        self.image_offset = self.unpack('i', self.read(0xA, 0x4))
        self.width = self.unpack('i', self.read(0x12, 0x4))
        self.height = self.unpack('i', self.read(0x16, 0x4))
        self.aspect_ratio = self.width / self.height
        self.bits_per_pixel = self.unpack('h', self.read(0x1C, 0x2))
        self.row_size = math.floor((self.bits_per_pixel * self.width + 31) / 32) * 4

    def read(self, offset, size):
        '''
        Reads size number of bytes from input file, starting at 'offset'
        '''
        self.image_file.seek(offset)
        return self.image_file.read(size)

    def unpack(self, fmt, string):
        '''
        Unpacks a string according to the given format.
        struct.unpack always returns a tuple, though for our purposes, this will always be a single-item tuple.
        '''
        return struct.unpack(fmt, string)[0]

    def file_header(self):
        return self.read(0x0, 0xE)

    def dib_header(self):
        dib_header_size = self.unpack('i', self.read(0xE, 0x4))
        return self.read(0xE, dib_header_size)

    def pixel(self, x, y):
        '''
        Return a Pixel object for the pixel at coordinates x, y.
        BMP pixel representation varies depending on the bit depth.
        x and y values are zero-indexed.
        BMP generally stores pixel data from top to bottom, and from left to right. However, this method treats
        pixel coordinates as if they are indexed from top to bottom.
        '''
        if x > self.width - 1:
            raise IndexError("x value out of range")
        if y > self.height - 1:
            raise IndexError("y value out of range")

        if self.bits_per_pixel >= 8:
            offset = int(self.image_offset + ((self.height - y - 1) * self.row_size) + (x * (self.bits_per_pixel // 8 )))
            #offset = self.image_offset + ((self.height * self.row_size) - (y * self.row_size)) + (x * (self.bits_per_pixel // 8 ))
            size = self.bits_per_pixel // 8
        else:
            offset = 10 # TODO: Fill this in
            size = 10 # TODO: Fill this in

        pixel_data = self.read(offset, size)

        if self.bits_per_pixel == 32:
            red, green, blue = (255, 255, 255) # TODO: Will need this for non 24-bit BMP
        elif self.bits_per_pixel == 24:
            red = pixel_data[2]
            green = pixel_data[1]
            blue = pixel_data[0]
        elif self.bits_per_pixel == 16:
            red, green, blue = (255, 255, 255) # TODO: Will need this for non 24-bit BMP
        elif self.bits_per_pixel == 8:
            red, green, blue = (255, 255, 255) # TODO: Will need this for non 24-bit BMP
        elif self.bits_per_pixel == 4:
            red, green, blue = (255, 255, 255) # TODO: Will need this for non 24-bit BMP
        elif self.bits_per_pixel == 2:
            red, green, blue = (255, 255, 255) # TODO: Will need this for non 24-bit BMP
        else:
            red, green, blue = (255, 255, 255) # TODO: Will need this for non 24-bit BMP
        return Pixel(red, green, blue, x, y)

def asciify(img, output_width):
    '''
    Takes an Img object, and returns a ASCII string representation of the image.
    '''

    # ASCII string representing luminance values from dark to light.
    ascii_luminance_map = "$@B%8&WM#*oahkbdpqwmZO0QLCJUYXzcvunxrjft/\|()1{}[]?-_+~<>i!lI;:,\"^`'. "
    #ascii_luminance_map = "@%#*+=-:. "
    #ascii_luminance_map = "@MBHENR#KWXDFPQASUZbdehx*8Gm&04LOVYkpq5Tagns69owz$CIu23Jcfry%1v7l+it[] {}?j|()=~!-/<>\\\"^_';,:`. "

    if not output_width:
        output_width = img.width

    output_height = int(math.floor(output_width / img.aspect_ratio))
    input_height = img.height
    input_width = img.width

    pixels_per_char = (7,15) # TODO: Is this a good approximation? Is there a (fairly) standard aspect ratio for monospace fonts?

    output_char_height = output_height // pixels_per_char[1] # TODO: Refactor these variable names
    output_char_width = output_width // pixels_per_char[0] # TODO: Refactor these variable names

    height_something = input_height / output_char_height # TODO: Refactor these variable names
    width_something = input_width / output_char_width # TODO: Refactor these variable names


    output = []
    for row in range(output_char_height):
        output_row = []
        input_y = int(math.floor(row * height_something))
        for column in range(output_char_width):
            input_x = int(math.floor(column * width_something))
            luminance = img.pixel_luminance(input_x, input_y)
            map_length = len(ascii_luminance_map)
            character = ascii_luminance_map[int(math.floor((map_length - 1) * luminance))]
            output_row.append(character)
        output_row.append('\n')
        output.append(''.join(output_row))
    return ''.join(output)



if __name__ == '__main__':
    parser = argparse.ArgumentParser(description='Generate an ASCII representation of an image.')
    parser.add_argument('-i', '--input-file', type=argparse.FileType('rb'), default='-', required=True)
    parser.add_argument('-w', '--output-width', type=int)
    args = parser.parse_args()

    image_path = sys.argv[2]
    image_format = imghdr.what(image_path)
    format_list = ['bmp']

    # TODO: Python2 doesn't seem to handle bytes in the same way that python3 does
    # so for the moment (seeing as the Bmp object is basically superfluous, and was only written for the practice),
    # we'll just do a version check
    if image_format == 'bmp' and sys.version_info.major >= 3 and False:
        bmp = Bmp(args.input_file)
        ascii = asciify(bmp, args.output_width)
        print(ascii)
    else:
        img = Img(args.input_file)
        ascii = asciify(img, args.output_width)
        print(ascii)
