const BatteryChargingIcon = ({ width = 22, height = 22, className = "", ...props }) => (
    <svg 
        width={width} 
        height={height} 
        viewBox="0 0 22 22" 
        fill="none" 
        xmlns="http://www.w3.org/2000/svg"
        className={className}
        {...props}
    >
        <path d="M7.56258 6.1875H6.18758C5.17506 6.1875 4.35425 7.00831 4.35425 8.02083V13.9792C4.35425 14.9917 5.17506 15.8125 6.18758 15.8125H6.64591M13.5209 6.1875H13.9792C14.9918 6.1875 15.8126 7.00831 15.8126 8.02083V13.9792C15.8126 14.9917 14.9918 15.8125 13.9792 15.8125H12.6042" stroke="black" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M16.2708 9.85425H16.4999C17.1327 9.85425 17.6458 10.3673 17.6458 11.0001C17.6458 11.6329 17.1327 12.1459 16.4999 12.1459H16.2708" stroke="black" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M10.7708 6.1875L8.02075 11H12.1458L9.39575 15.8125" stroke="black" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
);

export default BatteryChargingIcon; 