const AlertIcon = ({ width = 24, height = 24, className = "", ...props }) => (
    <svg 
        width={width} 
        height={height} 
        viewBox="0 0 26 26" 
        fill="none" 
        xmlns="http://www.w3.org/2000/svg"
        className={className}
        {...props}
    >
        <path d="M5.36494 17.7164L11.0665 6.34461C11.866 4.7502 14.1418 4.75062 14.9406 6.34532L20.637 17.7171C21.3587 19.1578 20.3111 20.8542 18.6998 20.8542H7.30179C5.69009 20.8542 4.64257 19.1571 5.36494 17.7164Z" stroke="#DC2626" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M13 10.8333V13" stroke="#DC2626" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M13.5418 17.3334C13.5418 17.6325 13.2993 17.875 13.0002 17.875C12.701 17.875 12.4585 17.6325 12.4585 17.3334C12.4585 17.0342 12.701 16.7917 13.0002 16.7917C13.2993 16.7917 13.5418 17.0342 13.5418 17.3334Z" stroke="#DC2626"/>
    </svg>
);

export default AlertIcon; 