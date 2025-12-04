declare namespace JSX {
    interface IntrinsicElements {
        'gmpx-api-loader': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement> & {
            'key'?: string;
            'solution-channel'?: string;
        };
        'gmpx-place-picker': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement> & {
            'placeholder'?: string;
            'ref'?: any;
        };
        'gmp-map': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement> & {
            'center'?: string;
            'zoom'?: string;
            'map-id'?: string;
            'ref'?: any;
        };
        'gmp-advanced-marker': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement> & {
            'ref'?: any;
        };
    }
}
