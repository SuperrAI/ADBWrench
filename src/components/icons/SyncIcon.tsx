const SyncIcon = ({ width = 24, height = 24, className = "", color = "#D97706", ...props }) => (
    <svg 
        width={width} 
        height={height} 
        viewBox="0 0 22 22" 
        fill="none" 
        xmlns="http://www.w3.org/2000/svg"
        className={className}
        {...props}
    >
        <path d="M10.3127 13.5208L8.021 15.5833M8.021 15.5833L10.3127 17.6458M8.021 15.5833H12.146C15.1836 15.5833 17.646 13.1209 17.646 10.0833V9.85416" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M13.979 6.41666H9.854C6.81644 6.41666 4.354 8.8791 4.354 11.9167V12.1458M13.979 6.41666L11.6873 8.47916M13.979 6.41666L11.6873 4.35416" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
);

export default SyncIcon; 