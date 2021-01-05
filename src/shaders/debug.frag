
precision highp float;

in vec2 texCoord;
out vec4 fragmentColor;


uniform int u_currentFace;

uniform samplerCube u_inputTexture;



vec3 uvToXYZ(int face, vec2 uv)
{
	if(face == 0)
		return vec3(     1.f,   uv.y,    -uv.x);
		
	else if(face == 1)
		return vec3(    -1.f,   uv.y,     uv.x);
		
	else if(face == 2)
		return vec3(   +uv.x,   -1.f,    +uv.y);		
	
	else if(face == 3)
		return vec3(   +uv.x,    1.f,    -uv.y);
		
	else if(face == 4)
		return vec3(   +uv.x,   uv.y,      1.f);
		
	else //if(face == 5)
	{	return vec3(    -uv.x,  +uv.y,     -1.f);}
}


void main(void)   
{

    fragmentColor = vec4(texCoord.x*10.0, 0.0, texCoord.y*10.0, 1.0);
	

	vec2 newUV =texCoord;
	newUV = newUV*2.0-1.0;

	vec4 textureColor = vec4(0.0, 0.0, 0.0, 1.0);

	vec3 direction = normalize(uvToXYZ(u_currentFace, newUV.xy));
 
    textureColor = textureLod(u_inputTexture, direction,1.0);
	//textureColor = texture(u_inputTexture, texCoord);
	
	if(texCoord.x>0.1)
	{
		fragmentColor = textureColor;
	}

	if(texCoord.y>0.1)
	{
		fragmentColor = textureColor;
	}

}