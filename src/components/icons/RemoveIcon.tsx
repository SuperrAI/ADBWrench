const RemoveIcon = ({ width = 20, height = 20, className = "", ...props }) => (
    <svg 
        width={width} 
        height={height} 
        viewBox="0 0 20 20" 
        fill="none" 
        xmlns="http://www.w3.org/2000/svg"
        className={className}
        {...props}
    >
        <path d="M15.8327 9.99936C15.8327 6.77768 13.221 4.16602 9.99935 4.16602C6.77769 4.16602 4.16602 6.77768 4.16602 9.99936C4.16602 13.221 6.77769 15.8327 9.99935 15.8327C13.221 15.8327 15.8327 13.221 15.8327 9.99936Z" stroke="black" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M12.5 10H7.5" stroke="black" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
);

export default RemoveIcon; 