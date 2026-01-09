const VideoThumbnailIcon = ({ width = 56, height = 57, className = "", ...props }) => (
    <svg 
        width={width} 
        height={height} 
        viewBox="0 0 56 57" 
        fill="none" 
        xmlns="http://www.w3.org/2000/svg"
        className={className}
        {...props}
    >
        <path d="M11.0859 16.2499C11.0859 13.6726 13.1753 11.5833 15.7526 11.5833H40.2526C42.8299 11.5833 44.9193 13.6726 44.9193 16.2499V40.7499C44.9193 43.3272 42.8299 45.4166 40.2526 45.4166H15.7526C13.1753 45.4166 11.0859 43.3272 11.0859 40.7499V16.2499Z" stroke="#F87171" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M35.5833 28.5001L22.75 20.9167V36.0834L35.5833 28.5001Z" stroke="#F87171" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
);

export default VideoThumbnailIcon; 