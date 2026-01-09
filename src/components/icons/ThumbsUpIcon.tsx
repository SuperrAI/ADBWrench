const ThumbsUpIcon = ({ width = 20, height = 20, className = "", color = "#16A34A", ...props }) => (
    <svg 
        width={width} 
        height={height} 
        viewBox="0 0 20 20" 
        fill="none" 
        xmlns="http://www.w3.org/2000/svg"
        className={className}
        {...props}
    >
        <g clipPath="url(#clip0_5783_5812)">
            <path d="M6.58325 10V15.8333" stroke={color} strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M11.5502 6.98498L10.9821 9.32554H14.2941C14.4705 9.32554 14.6445 9.36661 14.8023 9.4455C14.96 9.52438 15.0973 9.63891 15.2031 9.78002C15.3089 9.92113 15.3805 10.0849 15.412 10.2585C15.4436 10.432 15.4343 10.6105 15.3849 10.7799C14.9393 12.3099 14.7993 14.719 13.6522 15.9155C11.5934 16.9888 7.58572 16.1427 5.30115 16.1427C4.99982 16.1427 4.71082 16.023 4.49774 15.8099C3.58066 14.8929 3.45919 10.6969 4.49774 9.65833C5.06364 9.09243 6.15185 9.32554 6.8691 9.32554C7.08048 9.32543 7.28764 9.26635 7.46728 9.15496C7.64693 9.04356 7.79193 8.88425 7.886 8.69496L9.48759 5.49642C9.70677 5.05869 10.1792 4.74901 10.6173 4.96744C10.8571 5.08698 11.0667 5.25916 11.2306 5.47112C11.3945 5.68307 11.5084 5.92932 11.5637 6.19146C11.6191 6.45361 11.6144 6.72487 11.5502 6.98498Z" stroke={color} strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round"/>
        </g>
        <defs>
            <clipPath id="clip0_5783_5812">
                <rect width="20" height="20" fill="white"/>
            </clipPath>
        </defs>
    </svg>
);

export default ThumbsUpIcon; 