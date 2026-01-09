const PresentationIcon = ({ width = 32, height = 32, className = "", ...props }) => (
    <svg 
        width={width} 
        height={height} 
        viewBox="0 0 32 32" 
        fill="none" 
        xmlns="http://www.w3.org/2000/svg"
        className={className}
        {...props}
    >
        <path d="M7.66683 6.33398H24.3335M7.66683 6.33398V17.6673C7.66683 19.1401 8.86074 20.334 10.3335 20.334H13.3335M7.66683 6.33398H6.3335M24.3335 6.33398V17.6673C24.3335 19.1401 23.1396 20.334 21.6668 20.334H18.6668M24.3335 6.33398H25.6668M13.3335 20.334L11.6668 25.6673M13.3335 20.334H18.6668M18.6668 20.334L20.3335 25.6673" stroke="#6A65CD" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M11.6655 16.332L14.6655 12.9987L17.3322 16.332L20.3322 10.332" stroke="#6A65CD" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
);

export default PresentationIcon; 