import '../../styles/templateComponents.css';

function CardBox({ as: Component = 'section', eyebrow, children, className, ...props }) {
  const cls = ['dashboard-card', className].filter(Boolean).join(' ');
  return (
    <Component className={cls} {...props}>
      {eyebrow ? <p className="dashboard-card__label">{eyebrow}</p> : null}
      {children}
    </Component>
  );
}

export default CardBox;
