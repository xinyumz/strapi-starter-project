declare module '@strapi/design-system';
declare module '@strapi/icons';
declare module '@strapi/helper-plugin';

// admin/src/types.d.ts

// Add module declarations for Strapi design system
declare module '@strapi/design-system' {
    import { FC, ComponentProps } from 'react';
    export const Button: FC<ComponentProps<'button'>>;
    export const Box: FC<ComponentProps<'div'>>;
    export const Typography: FC<ComponentProps<'p'>>;
    export const Stack: FC<ComponentProps<'div'>>;
    export const TextInput: FC<ComponentProps<'input'>>;
    export const Radio: FC<ComponentProps<'input'>>;
    export const Accordion: FC<ComponentProps<'div'>>;
    export const AccordionToggle: FC<ComponentProps<'button'>>;
    export const AccordionContent: FC<ComponentProps<'div'>>;
    export const Alert: FC<ComponentProps<'div'>>;
    export const Card: FC<ComponentProps<'div'>>;
    export const IconButton: FC<ComponentProps<'button'>>;
    export const Flex: FC<ComponentProps<'div'>>;
    export const Select: FC<ComponentProps<'select'>>;
    export const Option: FC<ComponentProps<'option'>>;
    export const Grid: FC<ComponentProps<'div'>>;
    export const GridItem: FC<ComponentProps<'div'>>;
}

// Add module declaration for Strapi icons
declare module '@strapi/icons' {
    import { FC, ComponentProps } from 'react';
    export const Trash: FC<ComponentProps<'svg'>>;
}

// Add module declaration for package.json
declare module '*.json' {
    const value: any;
    export default value;
}