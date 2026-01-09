const LowBatteryIcon = ({ width = 24, height = 24, className = "", color = "#D97706", ...props }) => (
    <svg 
        width={width} 
        height={height} 
        viewBox="0 0 24 22" 
        fill="none" 
        xmlns="http://www.w3.org/2000/svg"
        className={className}
        {...props}
    >
        <path d="M4.75 8.02083C4.75 7.00831 5.64543 6.1875 6.75 6.1875H15.25C16.3546 6.1875 17.25 7.00831 17.25 8.02083V13.9792C17.25 14.9917 16.3546 15.8125 15.25 15.8125H6.75C5.64543 15.8125 4.75 14.9917 4.75 13.9792V8.02083Z" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M7.75 8.9375V13.0625" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M17.75 9.85416H18C18.6904 9.85416 19.25 10.3672 19.25 11C19.25 11.6328 18.6904 12.1458 18 12.1458H17.75" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
);

export default LowBatteryIcon;