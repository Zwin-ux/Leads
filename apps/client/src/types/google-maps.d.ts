import 'react';

declare global {
    namespace JSX {
        interface IntrinsicElements {
            'gmpx-api-loader': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement> & {
                key?: string;
                'solution-channel'?: string;
            }, HTMLElement>;
            'gmpx-place-picker': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement> & {
                ref?: React.Ref<any>;
                placeholder?: string;
            }, HTMLElement>;
            'gmp-map': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement> & {
                ref?: React.Ref<any>;
                center?: string;
                zoom?: string;
                'map-id'?: string;
            }, HTMLElement>;
            'gmp-advanced-marker': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement> & {
                ref?: React.Ref<any>;
            }, HTMLElement>;
        }
    }
}
