function nearestPowerOf2(n)
{
    if (isPowerOf2(n))
    {
        return n;
    }
    return Math.pow(2.0, Math.round(Math.log(n) / Math.log(2.0)));
}

function isPowerOf2(n)
{
    return n && (n & (n - 1)) === 0;
}

function makeEven(n)
{
    if (n % 2 === 1)
    {
        return n + 1;
    }
    return n;
}

export { nearestPowerOf2, isPowerOf2, makeEven };
