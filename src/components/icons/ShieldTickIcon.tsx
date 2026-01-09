const ShieldTickIcon = ({ width = 22, height = 22, className = "", ...props }) => (
    <svg 
        width={width} 
        height={height} 
        viewBox="0 0 22 22" 
        fill="none" 
        xmlns="http://www.w3.org/2000/svg"
        className={className}
        {...props}
    >
        <path d="M10.9999 4.35425L4.35405 7.33342C4.35405 7.33342 3.66655 17.6459 10.9999 17.6459C18.3332 17.6459 17.6457 7.33342 17.6457 7.33342L10.9999 4.35425Z" stroke="black" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M8.9375 11.6875L10.0833 13.0625L13.0625 8.9375" stroke="black" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
);

export default ShieldTickIcon; 