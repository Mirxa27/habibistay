import type { Meta, StoryObj } from '@storybook/react';
import { ResponsiveImage } from '@/components/ui/ResponsiveImage';

const meta: Meta<typeof ResponsiveImage> = {
  title: 'Components/UI/ResponsiveImage',
  component: ResponsiveImage,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    publicId: {
      control: 'text',
      description: 'The public ID of the image in Cloudinary',
    },
    alt: {
      control: 'text',
      description: 'Alternative text for the image',
    },
    width: {
      control: { type: 'number', min: 100, max: 2000, step: 50 },
      description: 'Width of the image in pixels',
    },
    height: {
      control: { type: 'number', min: 100, max: 2000, step: 50 },
      description: 'Height of the image in pixels',
    },
    withPlaceholder: {
      control: 'boolean',
      description: 'Whether to show a blurred placeholder while loading',
      defaultValue: true,
    },
    sizes: {
      control: 'text',
      description: 'Sizes attribute for responsive images',
      defaultValue: '(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw',
    },
  },
  args: {
    publicId: 'habibistay/properties/room-1_pspz1y',
    alt: 'Luxury hotel room with a comfortable bed',
    width: 800,
    height: 600,
    withPlaceholder: true,
  },
};

export default meta;
type Story = StoryObj<typeof ResponsiveImage>;

export const Default: Story = {
  args: {},
};

export const WithCustomSizes: Story = {
  args: {
    sizes: '(max-width: 768px) 100vw, 50vw',
  },
};

export const WithoutPlaceholder: Story = {
  args: {
    withPlaceholder: false,
  },
};

export const WithFixedDimensions: Story = {
  args: {
    width: 400,
    height: 300,
    className: 'rounded-lg shadow-lg',
  },
};

export const WithCustomTransformations: Story = {
  args: {
    transformations: {
      quality: 80,
      format: 'webp',
      effect: 'grayscale',
      radius: 20,
    },
  },
};
