const ThumbsDownIcon = ({ width = 20, height = 20, className = "", color = "#D97706", ...props }) => (
    <svg 
        width={width} 
        height={height} 
        viewBox="0 0 20 20" 
        fill="none" 
        xmlns="http://www.w3.org/2000/svg"
        className={className}
        {...props}
    >
        <g clipPath="url(#clip0_5783_5815)">
            <path d="M13.25 10.8333V4.99992" stroke={color} strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M8.28302 13.8485L8.85112 11.508H5.53911C5.36272 11.508 5.18876 11.4669 5.03099 11.388C4.87322 11.3091 4.73599 11.1946 4.63015 11.0535C4.52432 10.9124 4.4528 10.7485 4.42124 10.575C4.38969 10.4015 4.39897 10.223 4.44836 10.0536C4.89395 8.52359 5.03391 6.11448 6.18106 4.91802C8.23985 3.8447 12.2475 4.69078 14.5321 4.69078C14.8334 4.69078 15.1224 4.81049 15.3355 5.02356C16.2526 5.94065 16.3741 10.1366 15.3355 11.1752C14.7696 11.7411 13.6814 11.508 12.9641 11.508C12.7528 11.5081 12.5456 11.5671 12.366 11.6785C12.1863 11.7899 12.0413 11.9492 11.9473 12.1385L10.3457 15.3371C10.1265 15.7748 9.65406 16.0845 9.21595 15.8661C8.97618 15.7465 8.76651 15.5743 8.60263 15.3624C8.43875 15.1504 8.32488 14.9042 8.26954 14.642C8.21419 14.3799 8.2188 14.1086 8.28302 13.8485Z" stroke={color} strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round"/>
        </g>
        <defs>
            <clipPath id="clip0_5783_5815">
                <rect width="20" height="20" fill="white"/>
            </clipPath>
        </defs>
    </svg>
);

export default ThumbsDownIcon; 