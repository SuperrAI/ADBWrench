const CpuIcon = ({ width = 24, height = 24, className = "", color = "#D97706", ...props }) => (
    <svg 
        width={width} 
        height={height} 
        viewBox="0 0 22 22" 
        fill="none" 
        xmlns="http://www.w3.org/2000/svg"
        className={className}
        {...props}
    >
        <path d="M6.1875 8.02083C6.1875 7.00831 7.00831 6.1875 8.02083 6.1875H13.9792C14.9917 6.1875 15.8125 7.00831 15.8125 8.02083V13.9792C15.8125 14.9917 14.9917 15.8125 13.9792 15.8125H8.02083C7.00831 15.8125 6.1875 14.9917 6.1875 13.9792V8.02083Z" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M8.9375 4.35417V5.72917" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M17.646 8.9375L16.271 8.9375" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M8.9375 16.2708V17.6458" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M5.729 8.9375L4.354 8.9375" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M13.0625 4.35417V5.72917" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M17.646 13.0625L16.271 13.0625" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M13.0625 16.2708V17.6458" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M5.729 13.0625L4.354 13.0625" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
);

export default CpuIcon; 