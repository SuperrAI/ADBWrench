const UploadIcon = ({ width = 18, height = 18, className = "", ...props }) => (
    <svg 
        width={width} 
        height={height} 
        viewBox="0 0 18 18" 
        fill="none" 
        xmlns="http://www.w3.org/2000/svg"
        className={className}
        {...props}
    >
        <path d="M14.4375 12.9375V7.3125C14.4375 6.48407 13.7659 5.8125 12.9375 5.8125H3.5625V12.9375C3.5625 13.7659 4.23407 14.4375 5.0625 14.4375H12.9375C13.7659 14.4375 14.4375 13.7659 14.4375 12.9375Z" stroke="white" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M10.125 5.625L9.42639 4.34422C9.16354 3.86233 8.65847 3.5625 8.10955 3.5625H5.0625C4.23407 3.5625 3.5625 4.23407 3.5625 5.0625V8.25" stroke="white" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
);

export default UploadIcon; 