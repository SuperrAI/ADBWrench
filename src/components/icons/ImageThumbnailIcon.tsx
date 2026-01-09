const ImageThumbnailIcon = ({ width = 56, height = 56, className = "", ...props }) => (
    <svg 
        width={width} 
        height={height} 
        viewBox="0 0 56 56" 
        fill="none" 
        xmlns="http://www.w3.org/2000/svg"
        className={className}
        {...props}
    >
        <path d="M40.2526 11.0833H15.7526C13.1753 11.0833 11.0859 13.1726 11.0859 15.7499V40.2499C11.0859 42.8272 13.1753 44.9166 15.7526 44.9166H40.2526C42.8299 44.9166 44.9193 42.8272 44.9193 40.2499V15.7499C44.9193 13.1726 42.8299 11.0833 40.2526 11.0833Z" stroke="#D4D4D4" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M11.0859 37.3333L17.4937 29.1822C19.3107 26.8709 22.7865 26.7953 24.7023 29.0254L30.3359 35.5833" stroke="#D4D4D4" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M25.4688 29.9203C27.8888 26.8418 31.2608 22.4806 31.4801 22.1968L31.5034 22.167C33.3237 19.8706 36.7884 19.8002 38.7 22.0254L44.3336 28.5833" stroke="#D4D4D4" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
);

export default ImageThumbnailIcon; 