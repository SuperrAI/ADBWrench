const TeacherAssignIcon = ({ width = 24, height = 25, className = "", ...props }) => (
    <svg 
        width={width} 
        height={height} 
        viewBox="0 0 24 25" 
        fill="none" 
        xmlns="http://www.w3.org/2000/svg"
        className={className}
        {...props}
    >
        <path d="M5.75 5.25H18.25M5.75 5.25V13.75C5.75 14.8546 6.64543 15.75 7.75 15.75H10M5.75 5.25H4.75M18.25 5.25V13.75C18.25 14.8546 17.3546 15.75 16.25 15.75H14M18.25 5.25H19.25M10 15.75L8.75 19.75M10 15.75H14M14 15.75L15.25 19.75" stroke="black" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M8.75 12.75L11 10.25L13 12.75L15.25 8.25" stroke="black" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
);

export default TeacherAssignIcon; 