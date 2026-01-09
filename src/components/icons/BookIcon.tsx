const BookIcon = ({ width = 22, height = 22, className = "", ...props }) => (
    <svg 
        width={width} 
        height={height} 
        viewBox="0 0 20 20" 
        fill="none" 
        xmlns="http://www.w3.org/2000/svg"
        className={className}
        {...props}
    >
        <path d="M16.0416 12.7083V4.79159C16.0416 4.33135 15.6685 3.95825 15.2083 3.95825H5.62492C4.70444 3.95825 3.95825 4.70444 3.95825 5.62492V13.9583" stroke="black" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M16.0416 12.7083H5.62492C4.70444 12.7083 3.95825 13.4544 3.95825 14.3749C3.95825 15.2954 4.70444 16.0416 5.62492 16.0416H16.0416V12.7083Z" stroke="black" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
);

export default BookIcon; 