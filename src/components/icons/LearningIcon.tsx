const LearningIcon = ({ width = 28, height = 28, className = "", ...props }) => (
    <svg 
        width={width} 
        height={height} 
        viewBox="0 0 28 28" 
        fill="none" 
        xmlns="http://www.w3.org/2000/svg"
        className={className}
        {...props}
    >
        <path d="M2.33105 9.33249C2.33105 10.8981 11.7767 15.1667 13.9833 15.1667C16.1901 15.1667 25.6356 10.8981 25.6356 9.33249C25.6356 7.76684 16.1901 3.49829 13.9833 3.49829C11.7767 3.49829 2.33105 7.76684 2.33105 9.33249Z" stroke="black" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M6.99097 12.8333L8.45081 19.6002C8.5508 20.0637 8.78161 20.4967 9.16653 20.7729C11.7586 22.633 16.206 22.633 18.7981 20.7729C19.1831 20.4967 19.4139 20.0637 19.5139 19.6002L20.9737 12.8333" stroke="black" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M23.8902 11.0828V19.2507M23.8902 19.2507C22.9674 20.9383 22.5593 21.8425 22.1448 23.3346C22.0548 23.8656 22.1262 24.1331 22.4916 24.3706C22.6401 24.4671 22.8185 24.5014 22.9954 24.5014H24.7671C24.9554 24.5014 25.1454 24.4621 25.3006 24.355C25.6402 24.1205 25.7276 23.8631 25.6355 23.3346C25.2722 21.9491 24.8094 21.0019 23.8902 19.2507Z" stroke="black" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
);

export default LearningIcon; 