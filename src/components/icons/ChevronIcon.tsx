const ChevronIcon = ({ width = 28, height = 28, className = "", color = "black", ...props }) => (
    <svg 
        width={width} 
        height={height} 
        viewBox="0 0 28 28" 
        fill="none" 
        xmlns="http://www.w3.org/2000/svg"
        className={className}
        {...props}
    >
        <path d="M17.7918 12.5417L14.0002 16.6251L10.2085 12.5417" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
);

export default ChevronIcon;