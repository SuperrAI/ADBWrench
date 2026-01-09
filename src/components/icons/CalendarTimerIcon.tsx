const CalendarTimerIcon = ({ width = 22, height = 22, className = "", ...props }) => (
    <svg 
        width={width} 
        height={height} 
        viewBox="0 0 22 22" 
        fill="none" 
        xmlns="http://www.w3.org/2000/svg"
        className={className}
        {...props}
    >
        <path d="M17.6459 8.47925V8.02092C17.6459 7.00839 16.8251 6.18758 15.8126 6.18758H6.18758C5.17506 6.18758 4.35425 7.00839 4.35425 8.02092V15.8126C4.35425 16.8251 5.17506 17.6459 6.18758 17.6459H8.47925M13.7501 12.6042V13.7501L14.8959 14.8959M7.33341 4.35425V7.56258M14.6667 4.35425V7.56258M13.7501 17.6459C11.5985 17.6459 9.85425 15.9017 9.85425 13.7501C9.85425 11.5985 11.5985 9.85425 13.7501 9.85425C15.9017 9.85425 17.6459 11.5985 17.6459 13.7501C17.6459 15.9017 15.9017 17.6459 13.7501 17.6459Z" stroke="black" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
);

export default CalendarTimerIcon; 