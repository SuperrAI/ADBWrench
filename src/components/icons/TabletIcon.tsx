const TabletIcon = ({ width = 24, height = 24, className = "", color = "#2563EB", ...props }) => (
    <svg 
        width={width} 
        height={height} 
        viewBox="0 0 26 26" 
        fill="none" 
        xmlns="http://www.w3.org/2000/svg"
        className={className}
        {...props}
    >
        <path d="M5.146 7.31248C5.146 6.11586 6.11605 5.14581 7.31266 5.14581H18.6877C19.8843 5.14581 20.8543 6.11586 20.8543 7.31248V18.6875C20.8543 19.8841 19.8843 20.8541 18.6877 20.8541H7.31266C6.11605 20.8541 5.146 19.8841 5.146 18.6875V7.31248Z" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M13.2707 18.1458H12.729" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
);

export default TabletIcon;