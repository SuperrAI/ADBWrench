const CheckIcon = ({ width = 22, height = 22, className = "", ...props }) => (
    <svg 
        width={width} 
        height={height} 
        viewBox="0 0 22 22" 
        fill="none" 
        xmlns="http://www.w3.org/2000/svg"
        className={className}
        {...props}
    >
        <path d="M5.27075 11.7943L7.64487 15.046C8.38899 16.0652 9.91631 16.0454 10.6338 15.0072L16.7291 6.1875" stroke="black" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
);

export default CheckIcon; 