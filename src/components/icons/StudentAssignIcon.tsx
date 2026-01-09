const StudentAssignIcon = ({ width = 24, height = 25, className = "", ...props }) => (
    <svg 
        width={width} 
        height={height} 
        viewBox="0 0 24 25" 
        fill="none" 
        xmlns="http://www.w3.org/2000/svg"
        className={className}
        {...props}
    >
        <path d="M4.75 10.5L12 6.25L19.2501 10.5L12 14.75L4.75 10.5Z" stroke="black" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M12.5 10.5C12.5 10.7761 12.2761 11 12 11C11.7239 11 11.5 10.7761 11.5 10.5C11.5 10.2239 11.7239 10 12 10C12.2761 10 12.5 10.2239 12.5 10.5Z" stroke="black" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M6.75 12V16.75C6.75 16.75 8 18.75 12 18.75C16 18.75 17.25 16.75 17.25 16.75V12" stroke="black" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
);

export default StudentAssignIcon;