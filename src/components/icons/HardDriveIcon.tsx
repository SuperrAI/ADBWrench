const HardDriveIcon = ({ width = 24, height = 24, className = "", color = "#D97706", ...props }) => (
    <svg 
        width={width} 
        height={height} 
        viewBox="0 0 22 22" 
        fill="none" 
        xmlns="http://www.w3.org/2000/svg"
        className={className}
        {...props}
    >
        <path d="M4.354 14.6667C4.354 13.0213 5.68782 11.6875 7.33317 11.6875H14.6665C16.3119 11.6875 17.6457 13.0213 17.6457 14.6667C17.6457 16.312 16.3119 17.6458 14.6665 17.6458H7.33317C5.68782 17.6458 4.354 16.312 4.354 14.6667Z" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M7.79167 14.6667C7.79167 14.9198 7.58646 15.125 7.33333 15.125C7.0802 15.125 6.875 14.9198 6.875 14.6667C6.875 14.4135 7.0802 14.2083 7.33333 14.2083C7.58646 14.2083 7.79167 14.4135 7.79167 14.6667Z" stroke={color}/>
        <path d="M4.354 14.6667V13.1C4.354 12.4666 4.43607 11.8358 4.59817 11.2234L6.05539 5.71836C6.26826 4.91422 6.99584 4.35417 7.82769 4.35417H14.172C15.0038 4.35417 15.7314 4.91422 15.9443 5.71836L17.4015 11.2234C17.5636 11.8358 17.6457 12.4666 17.6457 13.1V14.6667" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M11.6875 14.6667H14.8958" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
);

export default HardDriveIcon; 